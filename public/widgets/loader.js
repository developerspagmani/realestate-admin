(function () {
    // 1. Configuration
    const CONTAINER_ID = 'cw-booking-portal';
    const SCRIPT_URL = document.currentScript ? document.currentScript.src : '';
    const BASE_URL = SCRIPT_URL ? new URL(SCRIPT_URL).origin : window.location.origin;

    // 2. Find the container
    const container = document.getElementById(CONTAINER_ID);
    if (!container) {
        console.warn('CoWorking Hub: Container #' + CONTAINER_ID + ' not found.');
        return;
    }

    // 3. Get Widget ID
    const widgetId = container.getAttribute('data-widget');
    if (!widgetId) {
        console.warn('CoWorking Hub: data-widget attribute missing on container.');
        return;
    }

    // 4. Create the Iframe
    const iframe = document.createElement('iframe');
    const embedUrl = BASE_URL + '/public/widgets/' + widgetId + '?embed=true';

    // Styling the iframe
    iframe.src = embedUrl;
    iframe.id = 'cw-widget-frame-' + widgetId;
    iframe.style.width = '100%';
    iframe.style.height = '600px'; // Initial height
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.transition = 'height 0.3s ease';
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('scrolling', 'no');

    // 5. Inject Iframe
    container.innerHTML = '';
    container.appendChild(iframe);

    // 6. PostMessage Listener for Responsive Height
    window.addEventListener('message', function (event) {
        // Basic security check (optional, can check event.origin)
        if (event.data && event.data.type === 'cw-widget-resize') {
            const frame = document.getElementById('cw-widget-frame-' + widgetId);
            if (frame && event.data.height) {
                frame.style.height = event.data.height + 'px';
            }
        }
    }, false);

})();
