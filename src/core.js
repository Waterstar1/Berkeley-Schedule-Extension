 $(document).ready(() => { 
   // Unique ID for the className.
    var MOUSE_VISITED_CLASSNAME = 'crx_mouse_visited';
    var POPUP = 'popuptext'

    // Previous dom, that we want to track, so we can remove the previous styling.
    var prevDOM = null;

    // Mouse listener for any move event on the current document.
    document.addEventListener('mousemove', function (e) {
    var srcElement = e.srcElement;

 
    // Lets check if our underlying element is a DIV.
    //srcElement.nodeName == 'DIV' || 
    if (srcElement.className == 'ls-course-title fmpbook') {
        // For NPE checking, we check safely. We need to remove the class name
        // Since we will be styling the new one after.
        
        if (prevDOM != null) {
            //prevDOM.classList.remove(MOUSE_VISITED_CLASSNAME);
        }

        // Add a visited class name to the element. So we can style it.
        if (srcElement.className == 'ls-course-title fmpbook') {
            var popUp = srcElement.querySelector(".popup");
            if (!popUp) {
                srcElement.classList.add(MOUSE_VISITED_CLASSNAME);
                popUp = $("<span/>", {class: 'popup'}).appendTo(srcElement);
            }
        }

        // The current element is now the previous. So we can remove the class
        // during the next iteration.
        prevDOM = srcElement;
    }
    }, false);
}); 