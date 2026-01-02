import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateFarmReport = (farmData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primaryColor = [22, 163, 74]; // Green
  const darkColor = [31, 41, 55];
  const grayColor = [107, 114, 128];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('EcoFarmLogix', 14, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Farm Summary Report', 14, 30);

  // Farm Details Section
  let yPos = 55;

  doc.setTextColor(...darkColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Farm Details', 14, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);

  const farmDetails = [
    ['Farm Name', farmData.farm?.name || 'N/A'],
    ['Farm Type', farmData.farm?.farmType || 'N/A'],
    ['Location', farmData.farm?.location || 'N/A'],
    ['Owner', farmData.farm?.owner?.fullName || 'N/A'],
    ['Total Devices', String(farmData.stats?.totalDevices || 0)],
    ['Online Devices', String(farmData.stats?.onlineDevices || 0)],
    ['Total Sensors', String(farmData.stats?.totalSensors || 0)],
    ['Total Actuators', String(farmData.stats?.totalActuators || 0)],
  ];

  doc.autoTable({
    startY: yPos,
    head: [],
    body: farmDetails,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 100 }
    },
    margin: { left: 14 }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // Sensor Readings Section
  if (farmData.devices && farmData.devices.length > 0) {
    doc.setTextColor(...darkColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Current Sensor Readings', 14, yPos);

    yPos += 5;

    const sensorData = [];
    farmData.devices.forEach(device => {
      if (device.sensors) {
        device.sensors.forEach(sensor => {
          sensorData.push([
            sensor.sensorName || sensor.sensorType,
            `${sensor.lastReading || 'N/A'} ${sensor.unit || ''}`,
            sensor.lastReadingAt ? new Date(sensor.lastReadingAt).toLocaleString() : 'N/A'
          ]);
        });
      }
    });

    if (sensorData.length > 0) {
      doc.autoTable({
        startY: yPos,
        head: [['Sensor', 'Reading', 'Last Updated']],
        body: sensorData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 }
      });
      yPos = doc.lastAutoTable.finalY + 15;
    }
  }

  // Check if we need a new page
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  // Actuator States Section
  if (farmData.devices && farmData.devices.length > 0) {
    doc.setTextColor(...darkColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Actuator States', 14, yPos);

    yPos += 5;

    const actuatorData = [];
    farmData.devices.forEach(device => {
      if (device.actuators) {
        device.actuators.forEach(actuator => {
          actuatorData.push([
            actuator.actuatorName || actuator.actuatorType,
            actuator.currentState ? 'ON' : 'OFF',
            actuator.lastActionAt ? new Date(actuator.lastActionAt).toLocaleString() : 'N/A'
          ]);
        });
      }
    });

    if (actuatorData.length > 0) {
      doc.autoTable({
        startY: yPos,
        head: [['Actuator', 'State', 'Last Action']],
        body: actuatorData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 }
      });
      yPos = doc.lastAutoTable.finalY + 15;
    }
  }

  // Check if we need a new page
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  // Recent Alerts Section
  if (farmData.recentAlerts && farmData.recentAlerts.length > 0) {
    doc.setTextColor(...darkColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Alerts', 14, yPos);

    yPos += 5;

    const alertData = farmData.recentAlerts.slice(0, 10).map(alert => [
      alert.alertType || 'Alert',
      alert.message || 'N/A',
      alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'N/A'
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Type', 'Message', 'Time']],
      body: alertData,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] }, // Red for alerts
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 14, right: 14 }
    });
    yPos = doc.lastAutoTable.finalY + 15;
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text(
      `Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `${farmData.farm?.name || 'Farm'}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export default { generateFarmReport };
