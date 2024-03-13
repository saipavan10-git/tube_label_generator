<?php
$module->initializeJavascriptModuleObject();

$module->includeJs("js/pdf-lib.min.js");
$module->includeJs("js/tlg.js");

?>

<form method="GET" id="tlg_form" action="javascript:;" onsubmit="TLG.generateTubeLabels(this)" class="form">
  <div class="input-group">
    <label for="ptid">PTID</label>
    <!-- <input type="text" name="ptid" id="ptid" value="100" /> -->
    <select class="select2-container" name="ptid" id="ptid" />
  </div>

<div class="form-group">
  <label for="visit_id">Visit ID</label>
  <input type="text" name="visit_id" id="visit_id" value="5" />
</div>
  <button type="submit" class="btn btn-primary mb-2">Submit</button>

</form>
