import { supabase } from './supabase.js';
import { openPdfPreview } from './pdf-generator.js';


document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('onboarding-form');
    const msgElement = document.getElementById('form-msg');
    const submitButton = form.querySelector('button[type="submit"]');


    // PDF Generation Listener
    const btnGeneratePdf = document.getElementById('btn-generate-pdf');
    const btnSubmit = document.getElementById('btn-submit');
    const pdfNotice = document.getElementById('pdf-notice');
    
    if (btnGeneratePdf) {
        btnGeneratePdf.addEventListener('click', () => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Also capture array fields (checkboxes)
            data.pain_points = formData.getAll('pain_points');
            data.delivery_platforms = formData.getAll('delivery_platforms');
            data.pos_system = formData.getAll('pos_system');

            // Trigger the pop-out native print functionality
            openPdfPreview(data);

            // Unlock Submit button after PDF is generated
            btnSubmit.disabled = false;
            btnSubmit.style.opacity = '1';
            btnSubmit.style.cursor = 'pointer';
            btnSubmit.innerText = 'Step 2 — Submit Application ✔';
            
            // Hide the warning notice and show a success confirmation
            pdfNotice.className = 'ios-notice success';
            pdfNotice.innerText = '✅ PDF generated! You can now submit your application.';
        });
    }

    // 4. Update the form submission to include to who this record belongs
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msgElement.innerText = '';
        msgElement.className = 'form-message';
        
        // Disable submit button while saving
        submitButton.disabled = true;
        submitButton.innerText = 'Submitting...';

        try {
            // Collect all form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Checkbox and multiple selects need special collection handling
            // Since `Object.fromEntries` only keeps the last value for multiple inputs (like checkboxes)
            // we manually collect array data for specific fields:
            
            const painPoints = formData.getAll('pain_points');
            const deliveryPlatforms = formData.getAll('delivery_platforms');
            const posSystem = formData.getAll('pos_system');

            // Construct payload according to our Database schema fields
            // Assuming our Supabase table is named 'merchants'
            const payload = {
                legal_name: data.legal_name,
                trade_name: data.trade_name,
                contact_name: data.contact_name,
                title_role: data.title_role,
                email: data.email,
                phone: data.phone,
                city: data.city,
                zip_code: data.zip_code,
                locations: parseInt(data.locations) || 1,
                address: data.address,
                business_type: data.business_type,
                operating_hours: data.operating_hours,
                
                avg_orders: parseInt(data.avg_orders) || 0,
                avg_ticket: parseFloat(data.avg_ticket) || null,
                peak_hours: data.peak_hours,
                own_drivers: data.own_drivers,
                self_delivering: data.self_delivering,
                using_3pl: data.using_3pl,
                pain_points: painPoints,
                
                delivery_platforms: deliveryPlatforms,
                pos_system: posSystem,
                own_website: data.own_website,
                own_app: data.own_app,
                
                service_type: data.service_type,
                go_live: data.go_live,
                main_problem: data.main_problem,
                
                contract_name: data.contract_name,
                ein_tax_id: data.ein_tax_id,
                billing_address: data.billing_address,
                authorized_signatory: data.authorized_signatory,
                
                comm_channel: data.comm_channel,
                weekly_call: data.weekly_call,
                wa_group: data.wa_group,
                notes: data.notes,
                
                // G. Access Credentials
                cred_doordash_user: data.cred_doordash_user,
                cred_doordash_pass: data.cred_doordash_pass,
                cred_doordash_notes: data.cred_doordash_notes,
                
                cred_uber_user: data.cred_uber_user,
                cred_uber_pass: data.cred_uber_pass,
                cred_uber_notes: data.cred_uber_notes,
                
                cred_delivery_user: data.cred_delivery_user,
                cred_delivery_pass: data.cred_delivery_pass,
                cred_delivery_notes: data.cred_delivery_notes,
                
                cred_own_user: data.cred_own_user,
                cred_own_pass: data.cred_own_pass,
                cred_own_notes: data.cred_own_notes
            };

            // Uncomment the lines below once you have added real VITE_SUPABASE_URL and KEY in .env
            // and created the `merchants` table in Supabase.
            //*
            const { error } = await supabase
                .from('merchants')
                .insert([payload]);

            if (error) {
                throw error;
            }
            //*/

            // Simulate successful api call for demonstration
            console.log("Submitting Payload to Supabase:", payload);
            await new Promise(resolve => setTimeout(resolve, 1500)); // Remove this line in production

            msgElement.innerText = "Application submitted successfully! Your Motoclick agent will contact you soon.";
            msgElement.classList.add('success');
            
            form.reset();
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('Error submitting form:', error);
            msgElement.innerText = "There was an error submitting your form. Please try again.";
            msgElement.classList.add('error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerText = 'Submit Application';
        }
    });
});
