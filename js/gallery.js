(() => {
    document.querySelectorAll('[data-gallery]').forEach((gallery) => {
        const items = Array.from(gallery.querySelectorAll('.gallery-slide'));
        const links = Array.from(gallery.querySelectorAll('.gallery-image'));
        const controls = gallery.querySelector('[data-gallery-controls]');
        const pageNumbers = gallery.querySelector('[data-gallery-pages]');
        const pagePrevious = gallery.querySelector('[data-gallery-page-prev]');
        const pageNext = gallery.querySelector('[data-gallery-page-next]');
        const pageStatus = gallery.querySelector('[data-gallery-status]');
        const dialog = gallery.querySelector('[data-gallery-viewer]');
        const image = dialog.querySelector('[data-viewer-image]');
        const caption = dialog.querySelector('[data-viewer-caption]');
        const details = dialog.querySelector('.gallery-viewer-details');
        const description = dialog.querySelector('[data-viewer-description]');
        const dimensions = dialog.querySelector('[data-viewer-dimensions]');
        const format = dialog.querySelector('[data-viewer-format]');
        const original = dialog.querySelector('[data-viewer-original]');
        const viewport = dialog.querySelector('.gallery-viewer-image');
        const zoom = dialog.querySelector('[data-viewer-zoom]');
        const status = dialog.querySelector('[data-viewer-status]');
        const previous = dialog.querySelector('[data-viewer-prev]');
        const next = dialog.querySelector('[data-viewer-next]');
        const pageSize = 6;
        const pageCount = Math.ceil(items.length / pageSize);
        let page = 0;
        let current = 0;

        if (!items.length) return;

        function showPage(index, focusPage = false) {
            page = Math.max(0, Math.min(index, pageCount - 1));
            items.forEach((item, position) => {
                item.hidden = Math.floor(position / pageSize) !== page;
            });
            controls.hidden = pageCount < 2;
            pagePrevious.disabled = page === 0;
            pageNext.disabled = page === pageCount - 1;
            pageStatus.textContent = `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, items.length)} of ${items.length}`;

            // Keep the first, last, and nearby pages within reach for large collections.
            pageNumbers.replaceChildren();
            let last = -1;
            for (let number = 0; number < pageCount; number += 1) {
                if (pageCount > 7 && number !== 0 && number !== pageCount - 1 && Math.abs(number - page) > 1) continue;
                if (last >= 0 && number - last > 1) {
                    const gap = document.createElement('span');
                    gap.textContent = '…';
                    gap.setAttribute('aria-hidden', 'true');
                    pageNumbers.append(gap);
                }
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'gallery-page-button';
                button.dataset.galleryPage = number;
                button.textContent = number + 1;
                button.setAttribute('aria-label', `Page ${number + 1}`);
                button.setAttribute('aria-controls', 'gallery-exhibitions');
                if (number === page) button.setAttribute('aria-current', 'page');
                button.addEventListener('click', () => showPage(number, true));
                pageNumbers.append(button);
                last = number;
            }
            if (focusPage) pageNumbers.querySelector('[aria-current]').focus({ preventScroll: true });
        }

        function setZoom(enlarged) {
            if (enlarged && (!image.complete || !image.naturalWidth)) return;
            viewport.classList.toggle('is-zoomed', enlarged);
            zoom.setAttribute('aria-pressed', String(enlarged));
            zoom.textContent = enlarged ? 'Fit image' : 'Zoom in';
            viewport.scrollTo({ left: enlarged ? viewport.clientWidth / 2 : 0, top: enlarged ? viewport.clientHeight / 2 : 0, behavior: 'instant' });
        }

        function updateDimensions() {
            dimensions.textContent = image.naturalWidth ? `${image.naturalWidth} × ${image.naturalHeight} px` : 'Unavailable';
            zoom.setAttribute('aria-disabled', String(!image.naturalWidth));
        }

        image.addEventListener('load', updateDimensions);
        image.addEventListener('error', updateDimensions);
        zoom.addEventListener('click', () => setZoom(!viewport.classList.contains('is-zoomed')));
        image.addEventListener('click', () => setZoom(!viewport.classList.contains('is-zoomed')));

        function showImage(index) {
            const focusedControl = document.activeElement;
            current = Math.max(0, Math.min(index, links.length - 1));
            const link = links[current];
            setZoom(false);
            dimensions.textContent = 'Loading…';
            zoom.setAttribute('aria-disabled', 'true');
            image.alt = link.querySelector('img').alt;
            image.src = link.href;
            original.href = link.href;
            const extension = new URL(link.href).pathname.split('.').pop().toLowerCase();
            format.textContent = { jpg: 'JPEG', jpeg: 'JPEG', png: 'PNG', webp: 'WebP', gif: 'GIF', avif: 'AVIF', bmp: 'BMP' }[extension] || '';
            dialog.querySelector('[data-viewer-format-row]').hidden = !format.textContent;
            const source = link.closest('.gallery-slide').querySelector('figcaption');
            caption.replaceChildren();
            if (source) caption.append(...Array.from(source.childNodes, (node) => node.cloneNode(true)));
            if (!caption.querySelector('h2')) {
                const heading = document.createElement('h2');
                heading.textContent = `Image ${current + 1}`;
                caption.prepend(heading);
            }
            description.textContent = image.alt;
            description.hidden = !image.alt || image.alt === 'Exhibition image' || Boolean(source?.textContent.includes(image.alt));
            details.scrollTop = 0;
            dialog.querySelector('.gallery-viewer-body').scrollTop = 0;
            if (image.complete) updateDimensions();
            status.textContent = `${current + 1} of ${links.length}`;
            previous.disabled = current === 0;
            next.disabled = current === links.length - 1;
            // Keep keyboard navigation inside the viewer when its focused arrow
            // becomes disabled at the first or last image.
            if (focusedControl === previous && previous.disabled) {
                (next.disabled ? dialog.querySelector('[data-viewer-close]') : next).focus();
            } else if (focusedControl === next && next.disabled) {
                (previous.disabled ? dialog.querySelector('[data-viewer-close]') : previous).focus();
            }
        }

        pagePrevious.addEventListener('click', () => showPage(page - 1, true));
        pageNext.addEventListener('click', () => showPage(page + 1, true));
        showPage(0);

        // The original image links still work when a browser cannot show a dialog.
        if (typeof dialog.showModal !== 'function') return;

        links.forEach((link, index) => {
            link.setAttribute('aria-haspopup', 'dialog');
            link.addEventListener('click', (event) => {
                if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                showImage(index);
                dialog.showModal();
                document.body.classList.add('gallery-viewer-open');
            });
        });
        previous.addEventListener('click', () => showImage(current - 1));
        next.addEventListener('click', () => showImage(current + 1));
        dialog.querySelector('[data-viewer-close]').addEventListener('click', () => dialog.close());
        dialog.addEventListener('keydown', (event) => {
            if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            // Let arrow keys pan a zoomed image when its scroll region has focus.
            if (event.target === viewport && viewport.classList.contains('is-zoomed')) return;
            const destinations = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: links.length - 1 };
            if (!(event.key in destinations)) return;
            event.preventDefault();
            showImage(destinations[event.key]);
        });
        dialog.addEventListener('click', (event) => {
            if (event.target !== dialog) return;
            const bounds = dialog.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
        });
        dialog.addEventListener('close', () => {
            document.body.classList.remove('gallery-viewer-open');
            const link = links[current];
            showPage(Math.floor(items.indexOf(link.closest('.gallery-slide')) / pageSize));
            link.focus({ preventScroll: true });
        });
    });
})();
