const TLG = ExternalModules.TLG.ExternalModule;
import ZebraBrowserPrintWrapper from 'zebra-browser-print-wrapper-v2';


$(document).ready(function () {
    const module = TLG;
    const GEN_LABEL_BUTTON_ID = 'gen-bio-labels';
    const GEN_HELP_BUTTON_ID = 'help-bio-labels';
    const { tagId, hasMultipleTags, tubeLabelGenFieldId, ptidFieldId, visitNumFieldId } = module.tt('emData');
    const tubeLabelPrintHelpUrl = module.tt('tubeLabelPrintHelpUrl')

    if (hasMultipleTags) {
        alert(`Multiple fields on this form have the ${tagId} tag. The button will only be applied to the first field.`);
    }

    const $tubeLabelGenTd = $(`#${tubeLabelGenFieldId}-tr > td:nth-child(2)`);
    const $ptidInputField = $(`#${ptidFieldId}-tr td:nth-child(2) input`);
    const $visitNumInputField = $(`#${visitNumFieldId}-tr td:nth-child(2) input`);

    // Append the "Generate biospecimen labels" button
    $tubeLabelGenTd.append(
        $('<button />')
            .html('Generate biospecimen labels')
            .attr({
                type: 'button',
                id: GEN_LABEL_BUTTON_ID,
                class: 'btn btn-info btn-sm',
                'aria-label': 'Generate biospecimen labels'
            })
            .prop('disabled', true)
    );

    // Append the "Tube Label Generator help icon"
    $tubeLabelGenTd.append(
        $('<i />')
            .addClass('fas fa-question-circle')
            .attr({
                id: GEN_HELP_BUTTON_ID,
                title: 'Printing Help',
                'aria-label': 'Printing Help'
            })
    );

    const $genLabelButton = $(`#${GEN_LABEL_BUTTON_ID}`);
    const $helpButton = $(`#${GEN_HELP_BUTTON_ID}`);

    // Event listener for help button click
    $helpButton.on('click', function () {
        // Disable scrolling on the body when the overlay is open
        $('body').css('overflow', 'hidden');

        // Create the overlay element
        const $overlay = $('<div />')
            .attr('id', 'helpOverlay')
            .html(`<div id="overlayContent">
            <button id="closeOverlay"><i class="fa-duotone fa-solid fa-circle-xmark"></i></button>
            <iframe src="${tubeLabelPrintHelpUrl}" width="100%" height="100%" frameborder="0"></iframe>
            </div>
        `);

        // Append the overlay to the body
        $('body').append($overlay);

        const closeOverlay = () => {
            $('#helpOverlay').remove();
            $('body').css('overflow', 'auto'); // Re-enable scrolling when closed
        };

        // Close the overlay on button click
        $('#closeOverlay').on('click', closeOverlay);

        // Close overlay when clicking outside the content
        $('#helpOverlay').on('click', function (e) {
            if ($(e.target).attr('id') === 'helpOverlay') {
                closeOverlay();
            }
        });

        // Close overlay on escape key press
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape') {
                closeOverlay();
            }
        });
    });

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

            // Show loading spinner
            $genLabelButton.prop('disabled', true).text('Generating... ').append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');

            // Make an ajax call to generate labels
            const response = await TLG.ajax("generateTubeLabels", { ptid, visit_num: visitNum });
            const labels = JSON.parse(response);
            const zplLabels = labels.map(item => generateZplLabel(item.ptid, item.type, item.barcode_str));
            const zplSheet = zplLabels.join('');

            const { printerCheckStatus, printerStatusDetails } = await printerPreCheck();
            if (printerCheckStatus) {
                const browserPrint = printerStatusDetails;
                const printStatus = await printTubeLabels(zplSheet, browserPrint);
                if (!printStatus) {
                    downloadZplFile(zplSheet);
                    alert("Printing failed. ZPL file is being downloaded.");
                }
            } else {
                alert(printerStatusDetails);
                return;
            }
        } catch (error) {
            console.error('Error generating labels:', error);
            alert('An error occurred while generating labels. Please try again.');
        }finally {
            // Reset the button text and enable it
            $genLabelButton.prop('disabled', false).text('Generate biospecimen labels');
        }
    });
});

// Generate ZPL Label
const generateZplLabel = (ptid, type, barcode) => {
    return `^XA
    ^PW380^LL192
    ^FO26,30^A0N,30,24^FD${barcode}^FS
    ^FO32,60^BQN,2,2,Q,7^FDQA,${barcode}^FS
    ^FO94,88^A0N,30,24^FD${ptid} ${type}^FS
    ^FO318,43^BQN,2,2,Q,1^FDQA,${barcode}^FS
    ^XZ`;
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

// Check if everything is set up correctly for printing
const printerPreCheck = async () => {
    try {
        const browserPrint = new ZebraBrowserPrintWrapper();
        // Execute both asynchronous tasks concurrently
        const [printers, defaultPrinter] = await Promise.all([
            browserPrint.getAvailablePrinters(),
            browserPrint.getDefaultPrinter()
        ]);
        if (!printers.length) {
            return {
                printerCheckStatus: false,
                printerStatusDetails: "No Zebra printers found. Please connect to a Zebra printer and try again."
            };
        }
        if (!defaultPrinter) {
            return {
                printerCheckStatus: false,
                printerStatusDetails: "Please set a default printer in the Zebra Browser Print App settings."
            };
        }
        browserPrint.setPrinter(defaultPrinter);
        const printerStatus = await browserPrint.checkPrinterStatus();
        if (printerStatus.isReadyToPrint === true) {
            return {
                printerCheckStatus: true,
                printerStatusDetails: browserPrint
            };
        } else {
            let errorMessage = "An unknown error occurred with the printer. Please check the printer connection and try again.";
            if (printerStatus.errors) {
                console.error("Printer status error:", printerStatus.errors);
                if (printerStatus.errors === 'Error: Unknown Error') {
                    errorMessage = "Printer might not be turned on or connected. Please check and try again.";
                } else {
                    errorMessage = "Printer is not ready to print due to: " + printerStatus.errors + ". Please resolve the issue and try again.";
                }
            }
            return { printerCheckStatus: false, printerStatusDetails: errorMessage };
        }
    }
    catch (error) {
        console.error("Error checking printer status:", error);
        if (error.message && error.message.includes('Failed to fetch')) {
            return { printerCheckStatus: false, printerStatusDetails: "Please check if the Zebra Browser Print App is running and try again." };
        } else {
            return { printerCheckStatus: false, printerStatusDetails: "Unknown Error Encountered while checking printer status." };
        }
    }
};

// Load Zebra Browser Print Wrapper and print the labels
const printTubeLabels = async (zpl, browserPrintObj) => {
    try {
        alert("Printing labels...");
        await browserPrintObj.print(zpl);
        return true;
    } catch (error) {
        console.error("Printing failed:", error);
        return false;
    }
};
