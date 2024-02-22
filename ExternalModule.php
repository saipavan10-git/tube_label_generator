<?php

namespace TLG\ExternalModule;

use ExternalModules\AbstractExternalModule;
use REDCap;

class ExternalModule extends AbstractExternalModule {

    const DEFAULT_INPUT_BASE = 10;
    const DEFAULT_OUTPUT_BASE = 16;

    function redcap_module_ajax($action, $payload) {

        switch ($action) {
            case "generateTubeLabels":
                return $this->generateLabelArray($payload['ptid'], $payload['visit_id']);
                break;
            case "getDataForDropdown":
                return $this->getDataForDropdown([1]);
                break;
            default:
                // $actions not in auth-ajax-actions throw an error
                // this block should never run
                return;
        }
    }


    function includeJs($path) {
        echo '<script src="' . $this->framework->getUrl($path) . '">;</script>';
    }


    function encodeUnique($ptid, $visit_id, $sample_symbol, $sample_num, int $ptid_pad = 6, int $visit_pad = 2, int $input_base = self::DEFAULT_INPUT_BASE, int $output_base = self::DEFAULT_OUTPUT_BASE) :string {
        /* converts ptid id and visit id into $output_base,
         * creates a checksum
         * concats all
         * Potentially 17 characters total
         * <ptid>-<visit_id>-<sample_symbol>-<sample_num>-checksum
         * 4 characters for human readability (-)
         * 6 characters for ptid; 16^6 = > 16 million ptids
         * 2 characters for visit; 16^2 = 256 visits per person
         * 2 or 1 characters for type; enum values
         * 2 or 1 characters for sample num; enum values
         * 1 character for checksum
         */
        $ptid_encode = str_pad(base_convert($ptid, $input_base, $output_base), $ptid_pad, '0', STR_PAD_LEFT);
        $visit_encode = str_pad(base_convert($visit_id, $input_base, $output_base), $visit_pad, '0', STR_PAD_LEFT);
        $label_data_arr = [$ptid_encode, $visit_encode, $sample_symbol, $sample_num];
        $check_digit = $this->generateLuhnChecksum(implode("", $label_data_arr), $output_base);
        array_push($label_data_arr, $check_digit);
        return strtoupper(implode("-", $label_data_arr));
    }


    function generateLuhnChecksum($input, $base) {
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
        return base_convert( ($base - $remainder) % $base, 10, $base );
    }


    function generateLabelArray($ptid, $visit_num) {
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
                $label_str =
                    "ptid: " . $ptid . "\n" .
                    "Type: " . $td['name']
                ;
                $barcode_obj = [
                    'label' => $label_str,
                    'barcode_str' => $id_str
                ];
                array_push($output_list, $barcode_obj);
            }
        }

        return json_encode($output_list);
    }


    function getDataForDropdown(array $fields) {
        //  $get_data = [
        //      'project_id' => PROJECT_ID,
        //      'fields' => $fields
        //  ];
        // $data = REDCap::getData($get_data);

        // HACK: provide sample data
        $response = [
            [
                "id" => 110001,
                "text" => "110001"
            ],
            [
                "id" => 110002,
                "text" => "110002"
            ],
        ];

        return $response;
    }
}
