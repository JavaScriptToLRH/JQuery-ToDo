// 立即运行的匿名函数(也叫立即调用函数)
// 用匿名函数作为一个“容器”，“容器”内部可以访问外部的变量，而外部环境不能访问“容器”内部的变量，
// 所以( function(){…} )()内部定义的变量不会和外部的变量发生冲突，俗称“匿名包裹器”或“命名空间”
// 函数前面的分号是为了结束之前的引入的库
;(function(){
    'use strict'
    var $window           = $(window),
        $body             = $('body'),
        $form_add_task    = $('.add-task'),
        $task_detail      = $('.task-detail'),
        $task_detail_mask = $('.task_detail_mask'),
        $msg              = $('.msg'),
        $msg_content      = $msg.find('.msg-content'),
        $msg_confirm      = $msg.find('.confirmed'),
        $alerter          = $('.alerter'),
        task_list         = [],
        $task_delete_trigger,
        $task_detail_trigger,
        current_index,
        $update_form,
        $task_detail_content,
        $task_detail_content_input,
        $checkbox_complete;

    init();

    // 当提交表单时，会发生 submit 事件。
    // 该事件只适用于 <div> 元素。
    // submit() 方法触发 submit 事件，或规定当发生 submit 事件时运行的函数。
    $form_add_task.on('submit', on_add_task_form_submit);
    $task_detail_mask.on('click', hide_task_detail);

    function pop(arg){
        if(!arg) {
            console.error('pop is required');
        }
        var conf = {},
            $box, $mask, $title, $content, $confirm, $cancel, dfd, confirmed, timer;

        if(typeof arg == 'string'){
            conf.title = arg;
        } else {
            conf = $.extend(conf, arg);
        }
        dfd = $.Deferred();
        $box = $('<div>' +
                    '<div class="pop-title">' + conf.title + '</div>' +
                    '<div class="pop-content">' +
                        '<div>' +
                            '<button style="margin-right:5px" class="primary confirm">确定</button>' +
                            '<button style="margin-left:5px" class="cancel">取消</button>' +
                        '</div>' +
                    '</div>' +
                '</div>').css({
            width: 300,
            height: 'auto',
            padding: '15px 10px',
            color: '#444',
            background: '#fff',
            position: 'fixed',
            'border-radius': 3,
            'box-shadow': '0 1px 2px rgba(0,0,0,0.5)'
        });
        $title = $box.find('.pop-title').css({
            padding: '5px 10px',
            'font-weight':900,
            'font-size':20,
            'text-align': 'center',
        })
        $content = $box.find('.pop-content').css({
            padding: '5px 10px',
            'text-align': 'center'
        })
        $mask = $('<div></div>').css({
            position: 'fixed',
            background: 'rgba(0,0,0,0.5)',
            top:0, bottom:0, right:0, left:0,
        })
        $confirm = $content.find('button.confirm');
        $cancel  = $content.find('button.cancel');

        timer = setInterval(function(){
            if(confirmed !== undefined){
                dfd.resolve(confirmed);
                clearInterval(timer);
                dismiss_pop();
            }
        }, 50)
        $confirm.on('click', on_confiremd);
        $cancel.on('click', on_cancel);
        $mask.on('click', on_cancel);
        function on_cancel(){
            confirmed = false;
        }
        function on_confiremd(){
            confirmed = true;
        }
        function dismiss_pop(){
            $mask.remove();
            $box.remove();
        }
        function adjust_box_position(){
            var window_width  = $window.width(),
                window_height = $window.height(),
                box_width     = $box.width(),
                box_height    = $box.height(),
                move_x, move_y;
            move_x = (window_width - box_width) / 2;
            move_y = (window_height - box_height) / 2 - 100;
            $box.css({
                left: move_x,
                top: move_y,
            })
        }
        $window.on('resize', function(){
            adjust_box_position();
        })
        $mask.appendTo($body);
        $box.appendTo($body);
        $window.resize();
        return dfd.promise();
    }

    function listen_msg_event(){
        $msg_confirm.on('click', function(){
            hide_msg();
        })
    }

    function on_add_task_form_submit(e){
        var new_task = {};
        // preventDefault() 方法阻止元素发生默认的行为（例如，当点击提交按钮时阻止对表单的提交）
        e.preventDefault();
        // 获取新task的值
        var $input = $(this).find('input[name=content]');
        // contents() 方法获得匹配元素集合中每个元素的子节点，包括文本和注释节点。
        new_task.content = $input.val();
        // 如果新task的值为空，则直接返回，否则继续执行
        if(!new_task.content){
            return;
        }
        // 存入新task
        if(add_task(new_task)){
            // render_task_list();
            $input.val('');
        }
    }

    //监听打开详情事件
    function listen_task_detail(){
        $('.task-item').on('dblclick', function(){
            var index = $(this).data('index');
            show_task_detail(index);
        });
        //监听单挑Task详细操作
        $task_detail_trigger.on('click', function(){
            var $this = $(this);
            var $item = $this.parent().parent();
            var index = $item.data('index');
            show_task_detail(index);
        });
    }

    //查看Task详情
    function show_task_detail(index){
        // 生成详情模板
        render_task_detail(index);
        current_index = index;
        // 显示详情模板，默认隐藏
        $task_detail.show();
        $task_detail_mask.show();
    }
    //隐藏Task详情
    function hide_task_detail(){
        $task_detail.hide();
        $task_detail_mask.hide();
    }

    // 更新Task
    function update_task(index, data){
        if(index === undefined || !task_list[index]){
            return;
        }
        // jQuery.extend() 函数用于将一个或多个对象的内容合并到目标对象。
        // 注意：1. 如果只为$.extend()指定了一个参数，则意味着参数target被省略。
        //          此时，target就是jQuery对象本身。通过这种方式，我们可以为全局对象jQuery添加新的函数。
        //      2. 如果多个对象具有相同的属性，则后者会覆盖前者的属性值。
        // $.extend( target [, object1 ] [, objectN ] )  指示是否深度合并 $.extend( [deep ], target, object1 [, objectN ] )
        // 警告: 不支持第一个参数传递 false 
        // deep	可选。     Boolean类型 指示是否深度合并对象，默认为false。如果该值为true，且多个对象的某个同名属性也都是对象，则该"属性对象"的属性也将进行合并。
        // target	      Object类型 目标对象，其他对象的成员属性将被附加到该对象上。
        // object1	可选。 Object类型 第一个被合并的对象。
        // objectN	可选。 Object类型 第N个被合并的对象。
        task_list[index] = $.extend({}, task_list[index], data);
        refresh_task_list();
    }

    // 渲染指定详情信息
    function render_task_detail(index){
        if(index === undefined || !task_list[index]){
            return;
        }
        var item = task_list[index];
        var tpl = '<form>' +
                    '<div class="content input-item">' + item.content + '</div>' +
                    '<div class="input-item"><input style="display:none" type="text" name="content" value="' + (item.content || '') + '"></div>' +
                    '<div>' +
                        '<div class="desc input-item">' +
                            '<textarea name="desc">'+ (item.desc || '') + '</textarea>' +
                        '</div>' +
                        '<div class="remind input-item">' +
                            '<label style="display:block; margin-bottom:10px;">提醒时间</label>' +
                            '<input class="datetime" name=remain_date type="text" value="' + (item.remain_date || '') + '">' +
                        '</div>' +
                    '</div>' +
                    '<div class="input-item"><button type="submit">更新</button></div>' +
                  '</form>';
        //清空详情模板
        $task_detail.html(null);
        //用新模板替换旧模板
        $task_detail.html(tpl);   
        $('.datetime').datetimepicker(); 
        //选中模板中的form元素
        $update_form               = $task_detail.find('form');
        $task_detail_content       = $update_form.find('.content');
        $task_detail_content_input = $update_form.find('[name=content]');        
        //双击内容元素，显示input，隐藏自己
        $task_detail_content.on('dblclick', function(){
            $task_detail_content_input.show();
            $task_detail_content.hide();
        })

        $update_form.on('submit', function(e){
            e.preventDefault();
            var data = {};
            //获取表单中各个input的值
            data.content     = $(this).find('[name=content]').val();
            data.desc        = $(this).find('[name=desc]').val();
            data.remain_date = $(this).find('[name=remain_date]').val();
            update_task(index, data);
            hide_task_detail();
        })    
    }

    // 查找并监听所有删除按钮的点击事件
    function listen_task_delete(){
        $task_delete_trigger.on('click', function(){
            var $this = $(this);
            // 找到删除按钮所在的task元素
            var $item = $this.parent().parent();
            var index = $item.data('index');
            // 确认删除
            pop('确定删除？').then(function(r){
                r ? delete_task(index) : null;
            });
        });
    }

    // 监听完成任务事件
    function listen_checkbox_complete(){
        $checkbox_complete.on('click', function(){
            var $this = $(this);
            // var is_complete = $this.is(':checked'); 
            var index       = $this.parent().parent().data('index');
            var item        = get(index);
            if(item.complete){
                update_task(index, {complete: false});
            } else {
                update_task(index, {complete: true});            
            }
        })
    }

    function get(index){
        return store.get('task_list')[index];
    }

    function add_task(new_task){
        // 将新task推入task_list
        task_list.push(new_task);
        // 更新localStrage
        refresh_task_list();
        return true;
    }

    //刷新localStorage数据并渲染view
    function refresh_task_list(){
        store.set('task_list', task_list);
        render_task_list();
    }

    // 删除一条task
    function delete_task(index){
        // 如果没有index或者index不存在则直接返回
        if(index === undefined || !task_list[index]) {
            return;
        }
        delete task_list[index];
        // 更新localStorage
        refresh_task_list();
    }

    function init(){
        task_list = store.get('task_list') || [];
        listen_msg_event();
        if(task_list.length){
            render_task_list();
        }
        task_remind_check();
    }

    function task_remind_check(){
        var current_timestamp;
        var itl = setInterval(function(){
            for(var i = 0; i < task_list.length; i++){
                var item = get(i),
                    task_timestamp;
                if(!item || !item.remain_date || item.informed){
                    continue;
                }
                current_timestamp = (new Date()).getTime();
                task_timestamp = (new Date(item.remain_date)).getTime();
                if(current_timestamp - task_timestamp >=1){
                    update_task(i, {informed: true});
                    show_msg(item.content);
                }
            }
        }, 300);
       
    }

    function show_msg(content){
        if(!msg) return;
        $msg_content.html(msg);
        $alerter.get(0).play();
        $msg.show();
    }
    
    function hide_msg(content){
        $msg.hide();
    }  

    // 渲染所有task模板
    function render_task_list(){
        var $task_list = $('.task-list');
        $task_list.html('');
        var complete_items = [];
        for(var i = 0; i < task_list.length; i++){
            var item = task_list[i];
            if(item && item.complete){
                complete_items[i] = item;
            } else {
                var $task = render_task_item(item, i);
            }
            $task_list.prepend($task);
            
        }
        console.log('complete_items',complete_items);
        console.log('task',$task);
        

        for(var j = 0; j < complete_items.length; j++){
            $task = render_task_item(complete_items[j], j);
            if(!$task) continue;
            $task.addClass('completed');
            $task_list.append($task);
        }

        $task_delete_trigger = $('.action.delete');
        $task_detail_trigger = $('.action.detail');
        $checkbox_complete   = $('.task-list .complete[type=checkbox]');
        listen_task_delete();
        listen_task_detail();
        listen_checkbox_complete();
    }

    // 渲染单条task模板
    function render_task_item(data, index) {
        if(!data || !index){
            return;
        }

        var list_item_tpl  = '<div class="task-item" data-index="'+ index +'">' +
                             '<span><input class="complete" ' + (data.complete ? 'checked' : '') + ' type="checkbox"></span>' +
                             '<span class="task-content">' + data.content + '</span>' +
                             '<span class="fr">' +
                             '<span class="action delete"> 删除</span>' +
                             '<span class="action detail"> 详细</span>' +
                             '</span>' +
                             '</div>';
        return $(list_item_tpl);
    }
})();