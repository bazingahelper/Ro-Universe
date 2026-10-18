let homeFolder = document.querySelectorAll(".home_folder")

function transitionFolderContent (event, parentFolder) {
    let clickedTab = event.currentTarget
    let associatedLabel = parentFolder.querySelector(`label[for="${clickedTab.id}"]`)
    let content = parentFolder.querySelector(`[data-linked-input-id="${clickedTab.id}"]`)
    let color = window.getComputedStyle(associatedLabel).backgroundColor
    let contentWindow = parentFolder.querySelector(".home_folder_window")

    
    contentWindow.style.transition = `background-color 90ms, height ${90}ms`
    contentWindow.innerHTML = content.innerHTML
    // console.log(window.getComputedStyle(contentWindow))
    contentWindow.style.height = `0px`
    contentWindow.style.color = '#00000000'


    setTimeout(function() {
        contentWindow.style.transition = `background-color 90ms, height ${3 * contentWindow.scrollHeight}ms`
        contentWindow.style.height = `${contentWindow.scrollHeight}px`
        contentWindow.style.color = ''
        contentWindow.style.backgroundColor = color
    }, 100)
    // console.log(contentWindow.scrollHeight)
}

homeFolder.forEach((folderSection) => {
    let folderTabs = folderSection.querySelector(".home_tags").querySelectorAll('input')
    folderTabs.forEach((tab) => {
        tab.addEventListener("change", function(event) {
            if (!event.currentTarget.checked) return
            transitionFolderContent(event, folderSection)
        })

        if (tab.checked) {
            let clickEvent = new Event('change')
            tab.dispatchEvent(clickEvent)
        }
    })

    
})