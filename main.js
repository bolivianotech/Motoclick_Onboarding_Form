import { supabase } from './supabase.js';
import { openPdfPreview } from './pdf-generator.js';


let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('onboarding-form');
    const msgElement = document.getElementById('form-msg');
    const submitButton = form.querySelector('button[type="submit"]');

    const authView = document.getElementById('auth-view');
    const formView = document.getElementById('form-view');
    const authMsg = document.getElementById('auth-msg');
    const sendLinkBtn = document.getElementById('send-magic-link');
    const userStatus = document.getElementById('user-status');
    const logoutBtn = document.getElementById('btn-logout');

    // 1. OMITIDO - Acceso libre sin autenticación
    showForm({ id: null, email: 'guest@motoclick.com' });

    /* Ocultamos los listeners de sesión de Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (session) showForm(session.user);
    else showAuth();

    supabase.auth.onAuthStateChange((_event, session) => {
        if (session) showForm(session.user);
        else showAuth();
    });
    */

    // 2. Handle Magic Link Sending
    sendLinkBtn.addEventListener('click', async () => {
        const emailInput = document.getElementById('auth-email').value;
        if (!emailInput) {
            authMsg.innerText = "Please enter an email.";
            authMsg.className = 'form-message error';
            return;
        }

        sendLinkBtn.disabled = true;
        sendLinkBtn.innerText = "Sending...";
        authMsg.innerText = "";

        const { error } = await supabase.auth.signInWithOtp({
            email: emailInput,
            options: {
                // Ensure the users are redirected back to this exact window after clicking link
                emailRedirectTo: window.location.origin
            }
        });

        if (error) {
            authMsg.innerText = error.message;
            authMsg.className = 'form-message error';
            sendLinkBtn.disabled = false;
            sendLinkBtn.innerText = "Send Magic Link";
        } else {
            authMsg.innerText = "Check your email for the magic link!";
            authMsg.className = 'form-message success';
            sendLinkBtn.innerText = "Sent!";
        }
    });

    // 3. Handle Logout
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
    });

    function showAuth() {
        authView.style.display = 'block';
        formView.style.display = 'none';
        currentUser = null;
    }

    function showForm(user) {
        authView.style.display = 'none';
        formView.style.display = 'block';
        currentUser = user;
        userStatus.innerText = `Logged in as: ${user.email}`;
    }

    // PDF Generation Listener
    const btnGeneratePdf = document.getElementById('btn-generate-pdf');
    if (btnGeneratePdf) {
        btnGeneratePdf.addEventListener('click', () => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Manual overrides from radio/checkbox groups if needed on PDF
            data.self_delivering = formData.get('self_delivering') || null; 

            // Trigger the pop-out native print functionality
            openPdfPreview(data);
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
                // Attach a static user id since the form is now public
                agent_id: (currentUser && currentUser.id) ? currentUser.id : null,
                
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
