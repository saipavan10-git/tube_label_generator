<?php

// have construction emoji
echo "<h1>🚧 PAGE UNDER CONSTRUCTION 🚧</h1>";
echo "<h6>Printing setup instructions can be found: <a href='" . $module->getUrl("assets/printing_help.pdf") . "'>here</a></h6>";


echo "<embed src='" . $module->getUrl("assets/additional_help.md") . "' width='100%' height='200px' type='application/pdf'>";

