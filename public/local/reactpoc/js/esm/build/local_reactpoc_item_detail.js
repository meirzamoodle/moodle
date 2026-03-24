import{jsx as i,jsxs as r}from"react/jsx-runtime";function n({item:e,strings:t}){return r("div",{children:[e.description?i("div",{dangerouslySetInnerHTML:{__html:e.description}}):i("p",{className:"text-muted fst-italic",children:t.noDescription}),e.files.length>0&&r("div",{className:"mt-3 pt-3 border-top",children:[i("strong",{children:t.previewAttachment})," ",i("a",{href:e.files[0].fileurl,target:"_blank",rel:"noopener noreferrer",children:e.files[0].filename})]}),r("div",{className:"text-muted small mt-3",children:[t.previewCreated," ",e.timecreated," \xB7 ",t.previewModified," ",e.timemodified]})]})}export{n as ItemDetailView};
/**
 * ItemDetailView — body content for the item detail Moodle modal.
 *
 * Renders description HTML, attachment link, and timestamps.
 * The modal chrome (title, close button) is provided by core/modal.
 *
 * @module     local_reactpoc/local_reactpoc_item_detail
 * @copyright  Meirza <meirza.arson@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
