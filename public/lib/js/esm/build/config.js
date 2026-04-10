var{wwwroot:e,apibase:n,sesskey:t,theme:s,jsrev:r,admin:o,usertimezone:i,language:u,courseId:c,courseContextId:d,contextid:a,contextInstanceId:g,siteId:m,userId:I}=M.cfg;export{o as admin,n as apibase,g as contextInstanceId,a as contextid,d as courseContextId,c as courseId,r as jsrev,u as language,t as sesskey,m as siteId,s as theme,I as userId,i as usertimezone,e as wwwroot};
/**
 * Typed accessor for Moodle's global M.cfg object.
 *
 * M.cfg is set by PHP (page_requirements_manager::get_config_for_javascript)
 * before any <script type="module"> runs, so it is always available when ESM
 * modules execute. Import individual values from here rather than accessing
 * window.M.cfg directly in components.
 *
 * @module     core/config
 * @copyright  2026 Moodle Pty Ltd <hello@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
