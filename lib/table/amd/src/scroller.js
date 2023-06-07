// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Module to handle dynamic table features.
 *
 * @module     core_table/scroller
 * @copyright  2023 The Open University of Israel
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
let loaded = false;
let scrolling = false; // Used to prevent event loops.

export const init = () => {
    if (loaded) {
        return; // Already loaded.
    }
    loaded = true;

    // Listen to the table width changes.
    const tableObserver = new ResizeObserver((entries) => {
        document.getElementById(entries[0].target.dataset.scroller).style.width =
            parseInt(entries[0].contentRect.width) + 'px';
    });

    let scrollers = document.querySelectorAll('.flexible_table_topscroller_container');

    scrollers.forEach(scroller => {
        let table = scroller.nextSibling.querySelector(':scope > table.flexible');
        if (table) {
            scroller.children[0].style.height = '1px'; // Set a height to show the scrollbar.
            if (!table.dataset.scroller) {
                table.dataset.scroller = scroller.children[0].id; // Make sure the table is linked to the scroller.
            }
            let tableContainer = table.parentNode;
            scroller.querySelector('.flexible_table_topscroller').style.width = window.getComputedStyle(table).width;
            tableContainer.addEventListener('scroll', (e) => {
                if (scrolling) {
                    scrolling = false;
                } else {
                    scrolling = true;
                    scroller.scrollLeft = e.target.scrollLeft;
                }
            });
            scroller.addEventListener('scroll', (e) => {
                if (scrolling) {
                    scrolling = false;
                } else {
                    scrolling = true;
                    tableContainer.scrollLeft = e.target.scrollLeft;
                }
            });
            tableObserver.observe(table);
        }
    });
};
