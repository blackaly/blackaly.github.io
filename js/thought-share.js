(() => {
    document.querySelectorAll('[data-thought-share]').forEach(share => {
        const button = share.querySelector('[data-thought-copy]');
        const status = share.querySelector('[role="status"]');
        const field = share.querySelector('.thought-share-url');
        if (!button || !status || !field) return;

        let copying = false;
        button.hidden = false;
        button.addEventListener('click', async () => {
            if (copying) return;
            copying = true;
            button.setAttribute('aria-busy', 'true');
            status.textContent = '';
            field.hidden = true;

            try {
                if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
                await navigator.clipboard.writeText(button.dataset.thoughtCopy);
                status.textContent = 'Link copied.';
            } catch {
                status.textContent = 'Select and copy the link:';
                field.hidden = false;
                field.focus();
                field.select();
            } finally {
                copying = false;
                button.removeAttribute('aria-busy');
            }
        });
    });
})();
