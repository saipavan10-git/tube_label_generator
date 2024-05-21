// module must be defined outside of the scope of the IIFE so the form can access it
const TLG = ExternalModules.TLG.ExternalModule;
// Wrap in immediately invoked function expression to retain global scope purity
(() => {
  TLG.generateTubeLabels = function(e) {
    // process form data into key value pairs
    // https://stackoverflow.com/a/29678476/7418735
    let raw_form_data = $("form#tlg_form").serializeArray();
    let data = {};
    $(raw_form_data).each((i, o) => {
      data[o.name] = o.value;
    });

    TLG.ajax("generateTubeLabels", data).then(r => {
      labels = JSON.parse(r);
      zplLabels = [];
      labels.forEach((item, index) => {
        const { ptid, type, barcode_str } = item;
        zplLabels.push(genrateZplLabel(ptid, type, barcode_str));
      });
      zplSheet = zplLabels.reduce((acc, curr) => (acc += curr), "");
      downloadMultiLabelPdf(zplSheet);
    });
  };

  TLG.ajax("getDataForPtidDropdown").then(response => {
    response = JSON.parse(response);

    // populate the dropdown with data
    $("#ptid").select2({
      data: response
    });
  });

  TLG.ajax("getDataForVisitDropdown").then(response => {
    response = JSON.parse(response);

    // populate the dropdown with data
    $("#visit_num").select2({
      data: response
    });
  });
})();

const genrateZplLabel = (ptid, type, barcode) => {
  zplLabel = `^XA^PW380^LL192^FO24,48^A0N,30,24^FD${barcode}^FS^FO30,78^BQN,2,2,Q,7^FDQA,${barcode}^FS^FO96,108^A0N,30,24^FD${ptid} ${type}^FS^FO300,60^BQN,2,2,Q,7^FDQA,${barcode}^FS^XZ`;
  return zplLabel;
};

// from https://gist.github.com/Lakerfield/1b77b03789525c9d0f13ddfeedee2efa
const printZpl = zpl => {
  var printWindow = window.open();
  printWindow.document.open("text/plain");
  printWindow.document.write(zpl);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};

const downloadMultiLabelPdf = async (zplSheet) => {
  const { PDFDocument } = PDFLib;

  var myHeaders = new Headers();
  myHeaders.append("Accept", "application/pdf");
  myHeaders.append("X-Page-Layout", "5x15");
  myHeaders.append("X-Page-Size", "A4");

  var formdata = new FormData();
  formdata.append("file", zplSheet);

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: formdata,
    redirect: 'follow'
  };

  try {
    // limits are described on https://labelary.com/service.html
    // Maximum 5 requests per second per client. Additional requests result in a HTTP 429 (Too Many Requests) error.
    // Maximum 50 labels per request. Additional labels result in a HTTP 413 (Payload Too Large) error. See the FAQ for details.
    const response = await fetch("https://api.labelary.com/v1/printers/12dpmm/labels/1.25x.625", requestOptions);
    const blob = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(blob);
    const pdfBytes = await pdfDoc.save();

    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(pdfBlob);
    window.open(url);
  } catch (error) {
    console.log('error', error);
  }
}
