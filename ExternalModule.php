<?php

namespace TLG\ExternalModule;

use ExternalModules\AbstractExternalModule;
use REDCap;

abstract class Page
{
    const DATA_ENTRY = 'DataEntry/index.php';
    const ONLINE_DESIGNER = 'Design/online_designer.php';
    const SURVEY = 'surveys/index.php';
    const SURVEY_THEME = 'Surveys/theme_view.php';
}

abstract class Validate
{
    static function pageIs(string $page): bool
    {
        return PAGE == $page;
    }

    static function pageIsIn(array $pages): bool
    {
        return in_array(PAGE, $pages);
    }
}

class ExternalModule extends AbstractExternalModule
{

    const DEFAULT_INPUT_BASE = 10;
    const DEFAULT_OUTPUT_BASE = 16;
    const TUBEL_LABEL_GEN_TAG = "@TUBE-LABEL-GENERATOR";
    const PTID_FIELD = "ptid_field";
    const VISIT_NUM_FIELD = "visit_num_field";

    private function containsTag(string $targetTag, ?string $tags): bool
    {
        return (isset($tags)) ? in_array($targetTag, explode(' ', $tags)) : false;
    }

    private function isXTypeField(array $field): bool
    {
        $isTextField = $field['element_type'] == 'text';
        return $isTextField;
        // $hasDateValidation = in_array($field['element_validation_type'], Validate::$date_validations);
        // return $isTextField && $hasDateValidation;
    }

    function redcap_module_ajax($action, $payload)
    {

        switch ($action) {
            case "generateTubeLabels":
                return $this->generateLabelArray($payload['ptid'], $payload['visit_num']);
                break;
            case "getDataForPtidDropdown":
                $ptid_field = $this->framework->getProjectSetting(self::PTID_FIELD);
                // TODO: handle null value
                return $this->getDataForDropdown($ptid_field);
                break;
            case "getDataForVisitDropdown":
                $visit_num_field = $this->framework->getProjectSetting(self::VISIT_NUM_FIELD);
                // TODO: handle null value
                return $this->getDataForDropdown($visit_num_field);
                break;
            default:
                // $actions not in auth-ajax-actions throw an error
                // this block should never run
                return;
        }
    }

    function redcap_every_page_top($project_id)
    {
        if (Validate::pageIs(Page::ONLINE_DESIGNER) && $project_id) {
            // Append the action tag in the designer view
            $this->initializeJavascriptModuleObject();
            $this->tt_addToJavascriptModuleObject('tubeLabelGenTag', self::TUBEL_LABEL_GEN_TAG);
            $this->includeJs('js/addActionTag.js');
        } else if (Validate::pageIsIn(array(Page::DATA_ENTRY, Page::SURVEY, Page::SURVEY_THEME)) && isset($_GET['id'])) {
            // Handle the logic of the action tag on data entry
            global $Proj;
            $instrument = $_GET['page'];
            $tubeLabelGenFields = [];

            // Iterate through all fields and search for fields with @TUBE-LABEL-GENERATOR tags and add them
            // to an array to pass to JS to handle. Note: although all fields with the tag are checked only
            // the first field will have the button appended to it.
            foreach (array_keys($Proj->forms[$instrument]['fields']) as $field_name) {
                $field = $Proj->metadata[$field_name];
                if ($this->isXTypeField($field)) {
                    $action_tags = $field['misc'];

                    if ($this->containsTag(self::TUBEL_LABEL_GEN_TAG, $action_tags)) {
                        array_push($tubeLabelGenFields, $field_name);
                    }
                }
            }

            if (!empty($tubeLabelGenFields)) {
                $this->initializeJavascriptModuleObject();
                $emData = ["tagId" => self::TUBEL_LABEL_GEN_TAG, "hasMultipleTags" => count($tubeLabelGenFields) > 1, "tubeLabelGenFieldId" => $tubeLabelGenFields[0], "ptidFieldId" => $this->getProjectSetting(self::PTID_FIELD), "visitNumFieldId" => $this->getProjectSetting(self::VISIT_NUM_FIELD)];
                $this->tt_addToJavascriptModuleObject('emData', $emData);
                $this->includeJs('js/generateTubeLabels.bundle.js');
            }

            // Add the help page link to the javascript object
            $this->initializeJavascriptModuleObject();
            $tubeLabelPrintHelpUrl = $this->getUrl("assets/printing_help.md");
            $this->tt_addToJavascriptModuleObject('tubeLabelPrintHelpUrl', $tubeLabelPrintHelpUrl);
            // Include css for the module
            $this->includeCss("assets/module.css");
        }
    }

    function includeJs($path)
    {
        echo '<script src="' . $this->framework->getUrl($path) . '">;</script>';
    }

    function includeCss($path)
    {
        echo '<link rel="stylesheet" href="' . $this->framework->getUrl($path) . '">';
    }

    function encodeUnique($ptid, $visit_num, $sample_symbol, $sample_num, int $ptid_pad = 6, int $visit_pad = 2, int $input_base = self::DEFAULT_INPUT_BASE, int $output_base = self::DEFAULT_OUTPUT_BASE): string
    {
        /* converts ptid id and visit id into $output_base,
         * creates a checksum
         * concats all
         * Potentially 17 characters total
         * <ptid>-<visit_num>-<sample_symbol>-<sample_num>-checksum
         * 4 characters for human readability (-)
         * 6 characters for ptid; 16^6 = > 16 million ptids
         * 2 characters for visit; 16^2 = 256 visits per person
         * 2 or 1 characters for type; enum values
         * 2 or 1 characters for sample num; enum values
         * 1 character for checksum
         */
        $ptid_encode = str_pad(base_convert($ptid, $input_base, $output_base), $ptid_pad, '0', STR_PAD_LEFT);
        $visit_encode = str_pad(base_convert($visit_num, $input_base, $output_base), $visit_pad, '0', STR_PAD_LEFT);
        $label_data_arr = [$ptid_encode, $visit_encode, $sample_symbol, $sample_num];
        $check_digit = $this->generateLuhnChecksum(implode("", $label_data_arr), $output_base);
        array_push($label_data_arr, $check_digit);
        return strtoupper(implode("-", $label_data_arr));
    }

    function generateLuhnChecksum($input, $base)
    {
        // https://en.wikipedia.org/wiki/Luhn_mod_N_algorithm
        // NOTE: base must be even to work, see: https://en.wikipedia.org/wiki/Luhn_mod_N_algorithm#Limitation
        $sum = 0;
        $factor = 2;

        settype($input, 'string');
        for ($i = strlen($input) - 1; $i >= 0; $i--) {
            $addend = base_convert($input[$i], $base, 10) * $factor;
            $addend = floor($addend / $base) + ($addend % $base); // sum of individual digits expressed in $base

            $sum += $addend;
            $factor = ($factor == 2) ? 1 : 2;
        }

        $remainder = $sum % $base;
        return base_convert(($base - $remainder) % $base, 10, $base);
    }

    function generateLabelArray($ptid, $visit_num)
    {
        $output_base = $this->framework->getProjectSetting("output_base") ?: self::DEFAULT_OUTPUT_BASE;

        // TODO: make this configurable
        $sample_definitions = [
            [
                'name' => 'blood',
                'symbol' => 'B',
                'count' => 3,
            ],
            [
                'name' => 'buffy coat',
                'symbol' => 'BC',
                'count' => 5,
            ],
            [
                'name' => 'paxgene',
                'symbol' => 'PG',
                'count' => 5,
            ],
            [
                'name' => 'plasma',
                'symbol' => 'P',
                'count' => 5,
            ],
            [
                'name' => 'serum',
                'symbol' => 'S',
                'count' => 5,
            ]
        ];

        $output_list = [];

        foreach ($sample_definitions as $td) {
            for ($i = 1; $i < $td['count'] + 1; ++$i) {
                $id_str = $this->encodeUnique($ptid, $visit_num, $td['symbol'], $i, output_base: $output_base);
                $barcode_obj = [
                    'ptid' => $ptid,
                    'type' => $td['name'],
                    'barcode_str' => $id_str
                ];
                array_push($output_list, $barcode_obj);
            }
        }

        return json_encode($output_list);
    }

    function getDataForDropdown(string $field)
    {
        // Get the field data
        $get_data = [
            'project_id' => PROJECT_ID,
            'fields' => $field
        ];
        $data = REDCap::getData($get_data);

        // populate response for jquery input field
        // the data needs to be in the format of [{id: <option_id>, text: <text_to_display>}]
        $response = [];
        foreach ($data as $entry) {
            $values = array_shift($entry);
            array_push($response, ["id" => $values[$field], "text" => $values[$field]]);
        }

        return json_encode($response);
    }
}
