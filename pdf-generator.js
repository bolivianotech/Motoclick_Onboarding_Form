export function openPdfPreview(data) {
    // We format arrays or empty data
    const formatValue = (val) => {
        if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : 'None';
        return val ? val : 'N/A';
    };

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <title>Onboarding Document - ${formatValue(data.trade_name)}</title>
    <style>
        @page { size: letter; margin: 1.5cm 1cm 1.5cm 2cm; }
        body { 
            font-family: 'Helvetica', 'Arial', sans-serif; 
            font-size: 13px; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            /* Padding as fallback for browsers that ignore @page margins in popups */
            padding: 1.5cm 1cm 1.5cm 2cm;
            background: white; 
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #005bb5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 22px;
            margin: 0;
            color: #005bb5;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header p {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        h2 { 
            font-size: 15px; 
            margin-top: 25px; 
            margin-bottom: 12px; 
            color: white; 
            background-color: #005bb5; 
            padding: 8px 12px;
            text-transform: uppercase;
        }
        .section {
            margin-bottom: 20px;
        }
        .grid-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px 30px;
        }
        .grid-full {
            grid-column: span 2;
        }
        .field {
            display: flex;
            flex-direction: column;
            border-bottom: 1px dotted #ccc;
            padding-bottom: 4px;
        }
        .label { 
            font-weight: bold; 
            font-size: 11px; 
            color: #555; 
            text-transform: uppercase;
        }
        .value { 
            font-size: 14px; 
            font-weight: 500;
            color: #000;
            margin-top: 4px;
            min-height: 18px;
        }
        .signature-block {
            margin-top: 50px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }
        .sig-line {
            border-top: 1px solid #000;
            padding-top: 5px;
            text-align: center;
            font-weight: bold;
            font-size: 12px;
        }
        .footer {
            margin-top: 40px;
            font-size: 10px;
            text-align: center;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }

        /* Print Specifics */
        @media print {
            body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
        }
    </style>
    </head>
    <body>
        <div class="no-print" style="background:#fff3cd; color:#856404; padding:15px; text-align:center; font-weight:bold; margin-bottom: 20px; border:1px solid #ffeeba;">
            Para guardar como PDF, selecciona "Guardar como PDF" en el menú "Destino" de la ventana de impresión (Ctrl+P / Cmd+P).
        </div>

        <div class="header">
            <h1>Motoclick Merchant Application</h1>
            <p>Official Integration & Onboarding Document | generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
            <h2>A. Business Information</h2>
            <div class="grid-container">
                <div class="field"><span class="label">Legal Business Name</span><span class="value">${formatValue(data.legal_name)}</span></div>
                <div class="field"><span class="label">DBA / Trade Name</span><span class="value">${formatValue(data.trade_name)}</span></div>
                <div class="field"><span class="label">Primary Contact Name</span><span class="value">${formatValue(data.contact_name)}</span></div>
                <div class="field"><span class="label">Title / Role</span><span class="value">${formatValue(data.title_role)}</span></div>
                <div class="field"><span class="label">Email Address</span><span class="value">${formatValue(data.email)}</span></div>
                <div class="field"><span class="label">Phone Number</span><span class="value">${formatValue(data.phone)}</span></div>
                <div class="field"><span class="label">City / Borough</span><span class="value">${formatValue(data.city)}</span></div>
                <div class="field"><span class="label">ZIP Code</span><span class="value">${formatValue(data.zip_code)}</span></div>
                <div class="field"><span class="label">Number of Locations</span><span class="value">${formatValue(data.locations)}</span></div>
                <div class="field"><span class="label">Business Type</span><span class="value">${formatValue(data.business_type)}</span></div>
                <div class="field grid-full"><span class="label">Main Address</span><span class="value">${formatValue(data.address)}</span></div>
                <div class="field grid-full"><span class="label">Operating Hours</span><span class="value">${formatValue(data.operating_hours)}</span></div>
            </div>
        </div>

        <div class="section">
            <h2>B. Operational Profile</h2>
            <div class="grid-container">
                <div class="field"><span class="label">Average Orders / Day</span><span class="value">${formatValue(data.avg_orders)}</span></div>
                <div class="field"><span class="label">Average Ticket ($)</span><span class="value">${formatValue(data.avg_ticket)}</span></div>
                <div class="field"><span class="label">Peak Hours</span><span class="value">${formatValue(data.peak_hours)}</span></div>
                <div class="field"><span class="label">Own Delivery Drivers?</span><span class="value">${formatValue(data.own_drivers)}</span></div>
                <div class="field"><span class="label">Currently Self-Delivering?</span><span class="value">${formatValue(data.self_delivering)}</span></div>
                <div class="field"><span class="label">Currently Using 3PL?</span><span class="value">${formatValue(data.using_3pl)}</span></div>
                <div class="field grid-full"><span class="label">Current Pain Points</span><span class="value">${formatValue(data.pain_points)}</span></div>
            </div>
        </div>

        <div class="section">
            <h2>C. Current Channels & Tech</h2>
            <div class="grid-container">
                <div class="field"><span class="label">Active Delivery Platforms</span><span class="value">${formatValue(data.delivery_platforms)}</span></div>
                <div class="field"><span class="label">POS / Middleware System</span><span class="value">${formatValue(data.pos_system)}</span></div>
                <div class="field"><span class="label">Own Website with Orders?</span><span class="value">${formatValue(data.own_website)}</span></div>
                <div class="field"><span class="label">Own App?</span><span class="value">${formatValue(data.own_app)}</span></div>
            </div>
        </div>

        <div class="section">
            <h2>D. Motoclick Integration</h2>
            <div class="grid-container">
                <div class="field"><span class="label">Service Type</span><span class="value">${formatValue(data.service_type)}</span></div>
                <div class="field"><span class="label">Target Go Live Date</span><span class="value">${formatValue(data.go_live)}</span></div>
                <div class="field grid-full"><span class="label">Main Problem to Solve</span><span class="value">${formatValue(data.main_problem)}</span></div>
            </div>
        </div>

        <div class="section">
            <h2>E. Billing & Payment Information</h2>
            <div class="grid-container">
                <div class="field"><span class="label">Legal Name for Contract</span><span class="value">${formatValue(data.contract_name)}</span></div>
                <div class="field"><span class="label">EIN / Tax ID</span><span class="value">${formatValue(data.ein_tax_id)}</span></div>
                <div class="field grid-full"><span class="label">Billing Address</span><span class="value">${formatValue(data.billing_address)}</span></div>
                <div class="field grid-full"><span class="label">Authorized Signatory</span><span class="value">${formatValue(data.authorized_signatory)}</span></div>
            </div>
            <p style="font-size: 11px; color:#555; margin-top: 10px;"><i>Note: Card details are collected securely via DocuSign, not via this onboarding form. Weekly automatic debit is applied every Monday.</i></p>
        </div>

        <div class="section">
            <h2>F. Communication Preferences</h2>
            <div class="grid-container">
                <div class="field"><span class="label">Preferred Channel</span><span class="value">${formatValue(data.comm_channel)}</span></div>
                <div class="field"><span class="label">Weekly Check-in Call?</span><span class="value">${formatValue(data.weekly_call)}</span></div>
                <div class="field"><span class="label">WhatsApp Ops Group?</span><span class="value">${formatValue(data.wa_group)}</span></div>
                <div class="field grid-full"><span class="label">Additional Notes</span><span class="value">${formatValue(data.notes)}</span></div>
            </div>
        </div>

        <div class="signature-block">
            <div>
                <br><br><br>
                <div class="sig-line">Signature - ${formatValue(data.authorized_signatory)}</div>
                <div style="text-align: center; font-size: 10px; margin-top:3px;">Authorized Signatory</div>
            </div>
            <div>
                <br><br><br>
                <div class="sig-line">Date</div>
            </div>
        </div>

        <div class="footer">
            Motoclick Internal Document - Confidential & Proprietary
        </div>

        <script>
            window.onload = function() {
                setTimeout(function() {
                    window.print();
                }, 800);
            };
        </script>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlTemplate);
        printWindow.document.close();
    } else {
        alert("Please allow popups for this website to generate PDFs.");
    }
}
