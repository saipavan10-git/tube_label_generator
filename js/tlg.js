// module must be defined outside of the scope of the IIFE so the form can access it
const TLG = ExternalModules.TLG.ExternalModule;
// Wrap in immediately invoked function expression to retain global scope purity
(() => {

  TLG.generateTubeLabels = function(e) {

    // process form data into key value pairs
    // https://stackoverflow.com/a/29678476/7418735
    let raw_form_data = $("form#tlg_form").serializeArray();
    let data = {}
    $(raw_form_data).each(
      (i, o) => {
        data[o.name] = o.value;
      }
    )

    TLG.ajax("generateTubeLabels", data)
       .then(
         (r) =>  {
           console.log(r)
         }
       )
  }

  let data = {
    ptid: 100,
    visit_id: 5
  }

    TLG.ajax("getDataForDropdown")
       .then(
         (r) => {
           $("#ptid").select2({
             data: r
           })
           // select boxes need to be resized to display values
           $(".select2-container").attr("style", "width: auto");
         }
       );

})()
