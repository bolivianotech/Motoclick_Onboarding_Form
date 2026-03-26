import { supabase } from './supabase.js';
import { openPdfPreview } from './pdf-generator.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('onboarding-form');
    const msgElement = document.getElementById('form-msg');
    const submitButton = form.querySelector('button[type="submit"]');

    // ===== OPERATING HOURS SLOT BUILDER =====
    const slotsWrapper = document.getElementById('operating-slots-wrapper');
    const addSlotBtn = document.getElementById('btn-add-slot');
    let slotCount = 0;

    function genHours() {
        return Array.from({ length: 24 }, (_, h) => {
            const v = String(h).padStart(2, '0');
            return `<option value="${v}">${v}</option>`;
        }).join('');
    }

    function genMinutes() {
        return ['00', '15', '30', '45']
            .map(m => `<option value="${m}">${m}</option>`).join('');
    }

    function addTimeSlot() {
        const id = slotCount++;
        const div = document.createElement('div');
        div.className = 'time-slot-entry';
        div.dataset.slotId = id;
        const isFirst = id === 0;
        div.innerHTML = `
            <div class="slot-days-grid">
                ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d =>
                    `<label class="slot-day-label"><input type="checkbox" class="slot-day" value="${d}"><span>${d}</span></label>`
                ).join('')}
            </div>
            <div class="slot-time-row">
                <div class="slot-time-block">
                    <span>Open</span>
                    <select class="slot-open-h">${genHours()}</select>
                    <span>:</span>
                    <select class="slot-open-m">${genMinutes()}</select>
                </div>
                <div class="slot-arrow">→</div>
                <div class="slot-time-block">
                    <span>Close</span>
                    <select class="slot-close-h">${genHours()}</select>
                    <span>:</span>
                    <select class="slot-close-m">${genMinutes()}</select>
                </div>
            </div>
            <div class="slot-date-row">
                <div><label>Valid From</label><input type="date" class="slot-date-from"></div>
                <div><label>Valid To</label><input type="date" class="slot-date-to"></div>
            </div>
            ${!isFirst ? `<button type="button" class="btn-remove-slot">✕ Remove this slot</button>` : ''}
        `;
        // Defaults: open 11:00, close 22:00
        div.querySelector('.slot-open-h').value = '11';
        div.querySelector('.slot-close-h').value = '22';
        if (!isFirst) {
            div.querySelector('.btn-remove-slot').addEventListener('click', () => div.remove());
        }
        slotsWrapper.appendChild(div);
    }

    // Serialize all slots to JSON and store in hidden field before submit
    function serializeSlots() {
        const slots = [];
        document.querySelectorAll('.time-slot-entry').forEach(slot => {
            const days = [...slot.querySelectorAll('.slot-day:checked')].map(cb => cb.value);
            slots.push({
                days,
                open: `${slot.querySelector('.slot-open-h').value}:${slot.querySelector('.slot-open-m').value}`,
                close: `${slot.querySelector('.slot-close-h').value}:${slot.querySelector('.slot-close-m').value}`,
                valid_from: slot.querySelector('.slot-date-from').value || null,
                valid_to: slot.querySelector('.slot-date-to').value || null,
            });
        });
        const json = JSON.stringify(slots);
        document.getElementById('operating_hours_hidden').value = json;
        return json;
    }

    addTimeSlot(); // Add the first slot by default
    addSlotBtn.addEventListener('click', addTimeSlot);
    // ===== END OPERATING HOURS SLOT BUILDER =====

    // ===== CONDITIONAL FIELDS =====
    // POS: show text field when "Other" is checked
    document.getElementById('pos-other-cb')?.addEventListener('change', (e) => {
        document.getElementById('pos-other-field').classList.toggle('visible', e.target.checked);
    });
    // Own Website: show URL field when "Yes" is selected
    document.querySelectorAll('input[name="own_website"]').forEach(r => {
        r.addEventListener('change', () => {
            document.getElementById('website-url-field').classList.toggle('visible', r.value === 'Yes' && r.checked);
        });
    });
    // Own App: show link field when "Yes" is selected
    document.querySelectorAll('input[name="own_app"]').forEach(r => {
        r.addEventListener('change', () => {
            document.getElementById('app-link-field').classList.toggle('visible', r.value === 'Yes' && r.checked);
        });
    });
    // Logo preview
    document.getElementById('logo_file')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = ev => {
                const preview = document.getElementById('logo-preview');
                preview.src = ev.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    // ===== END CONDITIONAL FIELDS =====

    // PDF Generation Listener
    const btnGeneratePdf = document.getElementById('btn-generate-pdf');
    const btnSubmit = document.getElementById('btn-submit');
    const pdfNotice = document.getElementById('pdf-notice');

    if (btnGeneratePdf) {
        btnGeneratePdf.addEventListener('click', () => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            data.pain_points = formData.getAll('pain_points');
            data.delivery_platforms = formData.getAll('delivery_platforms');
            data.pos_system = formData.getAll('pos_system');
            data.operating_hours = serializeSlots();
            openPdfPreview(data);
            // Unlock Submit button after PDF is generated
            btnSubmit.disabled = false;
            btnSubmit.style.opacity = '1';
            btnSubmit.style.cursor = 'pointer';
            btnSubmit.innerText = 'Step 2 — Submit Application ✔';
            pdfNotice.className = 'ios-notice success';
            pdfNotice.innerText = '✅ PDF generated! You can now submit your application.';
        });
    }

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msgElement.innerText = '';
        msgElement.className = 'form-message';
        submitButton.disabled = true;
        submitButton.innerText = 'Submitting...';

        try {
            // Serialize operating hours before collecting form data
            serializeSlots();

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const painPoints = formData.getAll('pain_points');
            const deliveryPlatforms = formData.getAll('delivery_platforms');
            const posSystem = formData.getAll('pos_system');

            // Handle logo upload to Supabase Storage
            let logoUrl = null;
            const logoFile = document.getElementById('logo_file')?.files[0];
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('logos')
                    .upload(fileName, logoFile, { cacheControl: '3600', upsert: false });
                if (!uploadError) {
                    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName);
                    logoUrl = urlData.publicUrl;
                } else {
                    console.warn('Logo upload error (non-fatal):', uploadError.message);
                }
            }

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
                logo_url: logoUrl,
                business_type: data.business_type,
                operating_hours: data.operating_hours, // JSON string from serializeSlots()

                avg_orders: parseInt(data.avg_orders) || 0,
                avg_ticket: parseFloat(data.avg_ticket) || null,
                peak_hours: data.peak_hours,
                own_drivers: data.own_drivers,
                self_delivering: data.self_delivering,
                using_3pl: data.using_3pl,
                pain_points: painPoints,

                delivery_platforms: deliveryPlatforms,
                pos_system: posSystem,
                pos_system_other: data.pos_system_other || null,
                own_website: data.own_website,
                website_url: data.website_url || null,
                own_app: data.own_app,
                app_link: data.app_link || null,

                service_type: data.service_type,
                go_live: data.go_live,
                main_problem: data.main_problem,

                contract_name: data.contract_name,
                ein_tax_id: data.ein_tax_id,
                billing_address: data.billing_address,
                authorized_signatory: data.authorized_signatory,

                comm_channel: data.comm_channel,
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

            const { error } = await supabase
                .from('merchants')
                .insert([payload]);

            if (error) throw error;

            console.log('Submitted:', payload);
            msgElement.innerText = 'Application submitted successfully! Your Motoclick agent will contact you soon.';
            msgElement.classList.add('success');
            form.reset();
            slotsWrapper.innerHTML = '';
            slotCount = 0;
            addTimeSlot();
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('Error submitting form:', error);
            msgElement.innerText = 'There was an error submitting your form. Please try again.';
            msgElement.classList.add('error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerText = 'Submit Application';
        }
    });
});
