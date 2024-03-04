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
        const {ptid, type, barcode_str } = item;
        zplLabels.push(genrateZplLabel(ptid, type, barcode_str));
      })
      zplSheet = zplLabels.reduce((acc, curr) => acc += curr, "")
      console.log(zplSheet);
    });
  };

  let data = {
    ptid: 100,
    visit_id: 5
  };

  TLG.ajax("getDataForDropdown").then(r => {
    $("#ptid").select2({
      data: r
    });
    // select boxes need to be resized to display values
    $(".select2-container").attr("style", "width: auto");
  });
})();


const genrateZplLabel = (ptid, type, barcode) => {
  zplLabel = `^XA^PW380^LL192^FO24,48^A0N,30,24^FD${barcode}^FS^FO30,78^BQN,2,2,Q,7^FDQA,${barcode}^FS^FO96,108^A0N,30,24^FD${ptid} ${type}^FS^FO300,60^BQN,2,2,Q,7^FDQA,${barcode}^FS^XZ`
  return zplLabel;
}

// from https://gist.github.com/Lakerfield/1b77b03789525c9d0f13ddfeedee2efa
const printZpl = (zpl) => {
  var printWindow = window.open();
  printWindow.document.open('text/plain')
  printWindow.document.write(zpl);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}
