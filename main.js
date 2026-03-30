import { supabase } from './supabase.js';
import { openPdfPreview, generatePdfBlob } from './pdf-generator.js';

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
    // ===== END CONDITIONAL FIELDS =====

    // PDF Generation Listener
    // Step logic removed - single button now.
    submitButton.disabled = false;
    submitButton.style.opacity = '1';
    submitButton.style.cursor = 'pointer';
    submitButton.innerText = 'Submit Application';

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

            // 0. Generate PDF Blob
            const pdfBlob = await generatePdfBlob(payload);
            
            // 1. Generate and Open PDF Preview (before reset)
            openPdfPreview(payload);

            // Create a FormData to send as multipart/form-data so we can attach the file natively
            const submitData = new FormData();
            
            // Append all payload fields
            for (const key in payload) {
                if (Array.isArray(payload[key])) {
                    // Send arrays as multiple fields suffixing [], n8n webhook parses this into an array
                    payload[key].forEach(val => submitData.append(`${key}[]`, val));
                } else if (payload[key] !== null && payload[key] !== undefined) {
                    submitData.append(key, payload[key]);
                }
            }
            
            // Append the PDF as a binary file called "data"
            // By calling it "data", n8n places it in the "data" binary property!
            if (pdfBlob) {
                submitData.append('data', pdfBlob, 'onboarding.pdf');
            }

            // 2. Send all data to n8n register-client webhook (primary)
            const response = await fetch('https://n8n.motoclickapp.com/webhook/reigster-client', {
                method: 'POST',
                body: submitData
            });

            if (!response.ok) {
                throw new Error(`Webhook failed with status ${response.status}`);
            }

            console.log('Client registration webhook sent successfully');

            // 3. Save to Supabase (secondary, non-blocking)
            try {
                const { error } = await supabase
                    .from('merchants')
                    .insert([payload]);
                if (error) console.warn('Supabase insert failed:', error);
            } catch (err) {
                console.warn('Supabase insert failed:', err);
            }

            console.log('Submitted:', payload);
            msgElement.innerText = 'Application submitted successfully! Opening PDF and notifying agent...';
            msgElement.classList.add('success');
            


            // Reset form after a slight delay so user can see success msg
            setTimeout(() => {
                form.reset();
                slotsWrapper.innerHTML = '';
                slotCount = 0;
                addTimeSlot();
            }, 2000);

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
