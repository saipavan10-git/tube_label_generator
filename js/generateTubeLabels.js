const TLG = ExternalModules.TLG.ExternalModule;
import ZebraBrowserPrintWrapper from 'zebra-browser-print-wrapper-v2';


$(document).ready(function () {
    const module = TLG;
    const GEN_LABEL_BUTTON_ID = 'gen-bio-labels';
    const { tagId, hasMultipleTags, tubeLabelGenFieldId, ptidFieldId, visitNumFieldId } = module.tt('emData');

    if (hasMultipleTags) {
        alert(`Multiple fields on this form have the ${tagId} tag. The button will only be applied to the first field.`);
    }

    const $tubeLabelGenTd = $(`#${tubeLabelGenFieldId}-tr > td:nth-child(2)`);
    const $ptidInputField = $(`#${ptidFieldId}-tr td:nth-child(2) input`);
    const $visitNumInputField = $(`#${visitNumFieldId}-tr td:nth-child(2) input`);

    // Append the "Generate biospecimen labels button"
    $tubeLabelGenTd.append(
        $('<button />')
            .html('Generate biospecimen labels')
            .css(
                {
                    'margin-top': '5px',
                },
            )
            .attr(
                {
                    type: 'button',
                    id: GEN_LABEL_BUTTON_ID,
                    class: 'btn btn-info btn-sm',
                },
            )
            .prop('disabled', true),
            
    );

    const $genLabelButton = $(`#${GEN_LABEL_BUTTON_ID}`);

    const handleOnFieldChange = () => {
        // if ptid and visit num have values then enable the button
        if ($ptidInputField.val() && $visitNumInputField.val()) {
            $genLabelButton.prop('disabled', false);
        } else {
            $genLabelButton.prop('disabled', true);
        }
    };

    // Attach input listeners for ptid and visit num field
    $ptidInputField.on('input', () => handleOnFieldChange());
    $visitNumInputField.on('input', () => handleOnFieldChange());
    
    // Call function to enable/disable the button on load
    handleOnFieldChange();

    // Attach click listener to the "Generate biospecimen labels" button
    $genLabelButton.on('click', async () => {
        try {
            const ptid = $ptidInputField.val();
            const visitNum = $visitNumInputField.val();
            // Make an ajax call to generate labels
            const response = await TLG.ajax("generateTubeLabels", { ptid, visit_num: visitNum });
            const labels = JSON.parse(response);
            const zplLabels = labels.map(item => genrateZplLabel(item.ptid, item.type, item.barcode_str));
            const zplSheet = zplLabels.join('');

            const printSuccess = await printTubeLabels(zplSheet);

            if (!printSuccess) {
                alert("Printing failed. Downloading the label ZPL file...");
                downloadZplFile(zplSheet);
            }
        } catch (error) {
            console.error('Error generating labels:', error);
        }
    });
});

// Generate ZPL Label
const genrateZplLabel = (ptid, type, barcode) => {
    return `^XA^PW380^LL192^FO26,30^A0N,30,24^FD${barcode}^FS^FO32,60^BQN,2,2,Q,7^FDQA,${barcode}^FS^FO98,90^A0N,30,24^FD${ptid} ${type}^FS^FO315,45^BQN,2,2,Q,1^FDQA,${barcode}^FS^XZ`;
};

// Download ZPL File if printing fails
const downloadZplFile = (zplSheet) => {
    const blob = new Blob([zplSheet], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'biospecimen_tube_labels.zpl';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Load Zebra Browser Print Wrapper and print the labels
const printTubeLabels = async (zpl) => {
    try {
        const browserPrint = new ZebraBrowserPrintWrapper();
        const defaultPrinter = await browserPrint.getDefaultPrinter();
        if (!defaultPrinter) {
            alert("Please connect to a Zebra printer and try again.");
            return false;
        }

        browserPrint.setPrinter(defaultPrinter);
        const printerStatus = await browserPrint.checkPrinterStatus();

        if (printerStatus.isReadyToPrint) {
            alert("Printing labels...");
            await browserPrint.print(zpl);
            return true;
        } else {
            console.error("Printer error(s):", printerStatus.errors);
            alert("Printer is not ready to print. Please check the printer and try again.");
            return false;
        }
    } catch (error) {
        console.error("Printing failed:", error);
        return false;
    }
};
