

import {psr_to_xyz} from "./util.js"
import {
	Vector3
} from "./lib/three.module.js";


class FloatLabelManager {
 
    id_enabled = true;
    category_enabled = true;
    color_scheme = "category";

    constructor(editor_ui, container_div, view, func_on_label_clicked)
    {
        this.view = view;  //access camera by view, since camera is dynamic
        this.editor_ui = editor_ui;
        this.container = container_div;
        this.labelsUi = editor_ui.querySelector("#floating-labels");
        this.floatingUi = editor_ui.querySelector("#floating-things");
        this.fastToolboxUi = editor_ui.querySelector("#obj-editor");
    
        this.style = document.createElement('style');
        this.temp_style = document.createElement('style');
        this.on_label_clicked = func_on_label_clicked;

        document.head.appendChild(this.style);            
        document.head.appendChild(this.temp_style);      
    }

    hide(){
        this.floatingUi.style.display="none";
    }

    show(){
        this.floatingUi.style.display="";
    }


    toggle_id(){
        
        if (this.id_enabled){
            this.style.sheet.insertRule(".label-obj-id-text {display: none}");
        }
        else{
            for (var i in this.style.sheet.cssRules){
                var r = this.style.sheet.cssRules[i];
                if (r.selectorText === ".label-obj-id-text"){
                    this.style.sheet.deleteRule(i);
                }
            }
            
        }

        this.id_enabled = !this.id_enabled;
        
    }

    toggle_category(){
        
        if (this.category_enabled){
            this.style.sheet.insertRule(".label-obj-type-text {display: none}");
        }
        else{
            for (var i in this.style.sheet.cssRules){
                var r = this.style.sheet.cssRules[i];
                if (r.selectorText === ".label-obj-type-text"){
                    this.style.sheet.deleteRule(i);
                }
            }
        }

        this.category_enabled = !this.category_enabled;
        
    }

    hide_all(){
        if (this.temp_style.sheet.cssRules.length == 0){
            this.temp_style.sheet.insertRule(".label-obj-id-text {display: none}");
            this.temp_style.sheet.insertRule(".label-obj-type-text {display: none}");
        }
    }

    restore_all(){
        if (this.temp_style.sheet.cssRules.length>0){
            this.temp_style.sheet.deleteRule(0);
            this.temp_style.sheet.deleteRule(0);    
        }    
    }

    remove_all_labels(){
        
        var _self = this;

        if (this.labelsUi.children.length>0){
            for (var c=this.labelsUi.children.length-1; c >= 0; c--){
                this.labelsUi.children[c].remove();                    
            }
        }
    }

    
    update_all_position(){
        if (this.labelsUi.children.length>0){
            for (var c=0; c < this.labelsUi.children.length; c++){
                var element = this.labelsUi.children[c];
                
                var best_pos = this.compute_best_position(element.vertices);
                var pos = this.coord_to_pixel(best_pos);

                element.style.top = Math.round(pos.y) + 'px';
                element.style.left = Math.round(pos.x) + 'px';


                element.className = element.orgClassName;
                if (pos.out_view){
                    element.className += " label-out-view";                         
                }
                
            }
        }
    }

    update_obj_editor_position(local_id){
        var label = this.editor_ui.querySelector("#obj-local-"+local_id);
        
        if (label){
            this.fastToolboxUi.style.top = label.style.top;
            this.fastToolboxUi.style.left = label.style.left;
        }
    }

    select_box(local_id){
        var label = this.editor_ui.querySelector("#obj-local-"+local_id);

        
        if (label){                
            if (!label.selected){
                label.className = "selected-float-label";
                label.hidden = true;
                label.selected = true;                
                
                this.fastToolboxUi.style.display = "inline-block";

                //this.editor_ui.querySelector("#obj-editor").style.display = "inherit";//"none";
                //this.editor_ui.querySelector("#obj-label").style.display = "none";
                //this.editor_ui.querySelector("#obj-label").innerText = label.innerText;
                
            }
        }
    }

    unselect_box(local_id){
        var label = this.editor_ui.querySelector("#obj-local-"+local_id);
        if (label){                
            label.className = label.orgClassName;
            label.hidden = false;
            label.selected = false;
            this.fastToolboxUi.style.display = "none";
        }
    }

    update_label_editor(obj_type, obj_track_id){
        this.editor_ui.querySelector("#object-category-selector").value = obj_type;
        this.editor_ui.querySelector("#object-track-id-editor").value = obj_track_id;
    }
    
    set_object_type(local_id, obj_type){
        var label = this.editor_ui.querySelector("#obj-local-"+local_id);
        if (label){
            label.obj_type = obj_type;
            label.update_text();
            this.update_color(label);
        }
    }

    
    set_object_track_id(local_id, track_id){
        var label = this.editor_ui.querySelector("#obj-local-"+local_id);

        if (label){
            label.obj_track_id = track_id;
            label.update_text();   
            this.update_color(label);             
        }
    }

    update_position(box, refresh){
        var label = this.editor_ui.querySelector("#obj-local-"+box.obj_local_id);
        
        if (label){
            label.vertices = psr_to_xyz(box.position, box.scale, box.rotation);  //vector 4

            if (refresh){
                var best_pos = this.compute_best_position(label.vertices);
                var pos = this.coord_to_pixel(best_pos);

                label.style.top = Math.round(pos.y) + 'px';
                label.style.left = Math.round(pos.x) + 'px';

                label.className = label.orgClassName;
                if (pos.out_view){
                    label.className += " label-out-view";                         
                }
            }
        }
    }

    

    remove_box(box){
        var label = this.editor_ui.querySelector("#obj-local-"+box.obj_local_id);

        if (label)
            label.remove();
    }

    set_color_scheme(color_scheme){
        this.color_scheme = color_scheme;
    }
    update_color(label)
    {
        if (this.color_scheme == "id")
        {                
            label.className = "float-label color-"+ (label.obj_track_id % 33);
        }
        else // by id
        {
            label.className = "float-label "+label.obj_type;
        }
        
        label.orgClassName = label.className;
    }

    add_label(box){
        
        var label = document.createElement('div');
        
        

        label.id = "obj-local-"+box.obj_local_id;

        var _self =this;

        label.update_text = function(){
            var label_text = '<div class="label-obj-type-text">';                
            label_text += this.obj_type;
            label_text += '</div>';

            label_text += '<div class="label-obj-id-text">';                
            label_text += this.obj_track_id;                
            label_text += '</div>';
            
            this.innerHTML = label_text; 
        }
        
        label.obj_type = box.obj_type;
        label.obj_local_id = box.obj_local_id;
        label.obj_track_id = box.obj_track_id;
        label.update_text();
        this.update_color(label);

        label.vertices = psr_to_xyz(box.position, box.scale, box.rotation);  //vector 4

        var best_pos = this.compute_best_position(label.vertices);
        best_pos = this.coord_to_pixel(best_pos);
        
        var pos = best_pos;
        
        label.style.top = Math.round(pos.y) + 'px';
        label.style.left = Math.round(pos.x) + 'px';

        if (pos.out_view){
            label.className += " label-out-view";
        }

        label.selected = false;

        this.labelsUi.appendChild(label);

        let self = this;
        label.onclick = ()=>{
            this.on_label_clicked(box);
        };
    }


    coord_to_pixel(p){
        var width = this.container.clientWidth, height = this.container.clientHeight;
        var widthHalf = width / 2, heightHalf = height / 2;

        var ret={
            x: ( p.x * widthHalf ) + widthHalf + 10,
            y: - ( p.y * heightHalf ) + heightHalf - 10,
            out_view: p.x>0.9 || p.x<-0.6 || p.y<-0.9 || p.y>0.9 || p.z< -1 || p.z > 1,
            // p.x<-0.6 to prevent it from appearing ontop of sideviews.
        }

        return ret;
    }

    compute_best_position(vertices){
        var _self = this;
        var camera_p = [0,1,2,3,4,5,6,7].map(function(i){
            return new Vector3(vertices[i*4+0], vertices[i*4+1], vertices[i*4+2]);
        });
        
        camera_p.forEach(function(x){
            x.project(_self.view.camera);
        });
        
        var visible_p = camera_p;

        var best_p = {x:-1, y: -1, z: -2};

        visible_p.forEach(function(p){
            if (p.x > best_p.x){
                best_p.x = p.x;
            }

            if (p.y > best_p.y){
                best_p.y = p.y;
            }

            if (p.z > best_p.z){
                best_p.z = p.z;
            }
        })

        return best_p;
    }
}


export {FloatLabelManager};