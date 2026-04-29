document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    const actionTriggers = document.querySelectorAll('.action-trigger');

    // Navigation function
    function navigateTo(targetId) {
        // Remove active class from all sections
        viewSections.forEach(section => section.classList.remove('active'));
        
        // Remove active class from sidebar items
        navItems.forEach(nav => nav.classList.remove('active'));

        // Show target section
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Highlight matching sidebar item if exists
        const matchingNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        if (matchingNav) {
            matchingNav.classList.add('active');
        }
    }

    // Sidebar clicks
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.dataset.target;
            if (targetId) navigateTo(targetId);
        });
    });

    // Quick action clicks (dashboard cards, etc)
    actionTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = trigger.dataset.target;
            if (targetId) navigateTo(targetId);
        });
    });

    // Interactive elements for UI prototype feel
    
    // E-Wallet selection
    const ewalletItems = document.querySelectorAll('.ewallet-item');
    ewalletItems.forEach(item => {
        item.addEventListener('click', () => {
            ewalletItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Nominal chips selection
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            // Update input value based on chip (remove dots)
            const input = document.querySelector('#topup input[type="number"]');
            if (input) {
                input.value = chip.textContent.replace(/\./g, '');
            }
        });
    });

    // Transfer tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
});
