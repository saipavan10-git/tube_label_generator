<?php
$module->initializeJavascriptModuleObject();

$module->includeJs("js/pdf-lib.min.js");
$module->includeJs("js/tlg.js");

?>

<form class="m-3" method="GET" id="tlg_form" action="javascript:;" onsubmit="TLG.generateTubeLabels(this)">
  <h5>Print labels for:</h5>
  <div class="mb-3">
    <label for="ptid" class="form-label" >PTID</label>
    <select class="form-select" name="ptid" id="ptid">
      <option selected>Select a ptid</option>
    </select>
  </div>
  <div class="mb-3>
    <label class="form-label" for="visit_num">Visit ID</label>
    <select class="form-select" name="visit_num" id="visit_num">
      <option selected>Select a visit number</option>
    </select>
  </div>
  <button class="btn btn-primary mt-3" type="submit">Print</button>
</form>
