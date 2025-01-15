# 📚 **REDCap Zebra Label Printer Printing Guide**

Welcome to the **REDCap Zebra Label Printer Printing Guide**!

This guide will walk you through setting up your Zebra printer and the necessary software for printing tube labels efficiently.

---

## 🛠️ **Printer Setup**

1. Follow the **Quick Start Guide** provided with your Zebra printer to complete the setup. Ensure you finish all steps up to **Step 9**, which includes **Smart Calibration**.

---

## 🌐 **Zebra Browser Print App Setup**

1. **[Download the Zebra Browser Print app](https://www.zebra.com/gb/en/support-downloads/software/printer-software/browser-print.html#browser-print)** for your operating system (Note: You'll need to complete a short survey to access the download).

   ![Zebra Survey](/assets/img/zebra_survey.png)

2. Unzip the downloaded file and run the installer.
   - Launch the app and agree to the license agreement.
   - When prompted with a pop-up about communicating with a web browser, add an exception for the certificate in your browser by following the on-screen instructions.

   ![Security Certificate](/assets/img/security_certificate.png)

3. After setup, you should see the message: _"SSL Certificate has been accepted. Retry connection."_

   ![Security Certificate Accepted](/assets/img/security_accept.png)

4. A pop-up will appear requesting access to any connected Zebra devices, _"localhost wants to access your Zebra Devices,"_ click **Yes** and add it to the accepted hosts list.

   ![Accept Localhost](/assets/img/localhost_accept.png)

5. A Zebra logo icon will also appear in your system tray this indicates that Zebra Browser Print is running.

   ![Zebra Browser Print Icon](/assets/img/zebra_icon.png)

---

## 🖨️ **Add Default Printer in Browser Print App**

1. In the Browser Print app, click the **Change** button next to **Default Devices**. A pop-up will appear with a
dropdown of all discoverable devices (finding network connected Zebra printers may take a few
moments).

    ![Default Printer Search](/assets/img/printer_dialog_box.png)

2. Select the printer you would like to print the labels from the list.

   ![Add Default Printer](/assets/img/printer_add.png)

3. Your printer is now ready for label printing from the **REDCap Project**.

---

## 🏷️ **Printing Labels from REDCap**

1. Navigate to an event on a record in REDCap where tube labels need to be printed (the field should contain the `@TUBE-LABEL-GENERATOR` action tag).
2. Click the **Generate biospecimen labels** button.
3. The first time you print, you may be asked to _"Allow_ [_https://redcap.ctsi.ufl.edu/redcap/_](https://redcap.ctsi.ufl.edu/redcap/)_" to access your printer._ Click **Yes** and add it to the accepted hosts list.

   ![Allow Redcap to Access](/assets/img/redcap_host_accept.png)

---

## ⚠️ **Troubleshooting: Misaligned Labels**

If your labels print misaligned, follow these calibration steps:

1. Ensure the **yellow sensor** behind the print roller is centered under the labels.
2. Press and hold both the **Pause** and **Cancel** buttons on the printer for 2 seconds. The printer will automatically roll out and calibrate the labels.
