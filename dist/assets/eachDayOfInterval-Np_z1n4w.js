import{c as d,t as a}from"./index-W-soaO4a.js";/**
 * @license lucide-react v0.414.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=d("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);function p(n,i){const e=a(n.start),s=a(n.end);let o=+e>+s;const c=o?+e:+s,t=o?s:e;t.setHours(0,0,0,0);let h=1;const r=[];for(;+t<=c;)r.push(a(t)),t.setDate(t.getDate()+h),t.setHours(0,0,0,0);return o?r.reverse():r}export{D as C,p as e};
