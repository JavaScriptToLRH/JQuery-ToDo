// 立即运行的匿名函数(也叫立即调用函数)
// 用匿名函数作为一个“容器”，“容器”内部可以访问外部的变量，而外部环境不能访问“容器”内部的变量，
// 所以( function(){…} )()内部定义的变量不会和外部的变量发生冲突，俗称“匿名包裹器”或“命名空间”
// 函数前面的分号是为了结束之前的引入的库
;(function(){
    'use strict'
    var $window           = $(window),//获取window对象
        $body             = $('body'),//获取body元素
        $form_add_task    = $('.add-task'),//获取添加清单的div
        $task_detail      = $('.task-detail'),//获取清单详情区域
        $task_detail_mask = $('.task_detail_mask'),//获取清单详情蒙版
        $msg              = $('.msg'),//获取清单提醒区域
        $msg_content      = $msg.find('.msg-content'),//获取清单提醒区域内容
        $msg_confirm      = $msg.find('.confirmed'),//获取清单提醒区域‘知道了’按钮
        $alerter          = $('.alerter'),//获取清单提醒音频
        task_list         = [],//定义清单列表数据数组
        $task_delete_trigger,//定义单条清单‘删除’按钮
        $task_detail_trigger,//定义单条清单‘详情’按钮
        current_index,
        $update_form,//用于存储清单详情区域form元素内容
        $task_detail_content,//用于存储清单详情区域标题 div.content
        $task_detail_content_input,//用于存储详情区域隐藏修改标题文本框 div.input[name="content"]
        $checkbox_complete;//用于存储单条清单前的选择框

    init();

    // 当提交表单时，会发生 submit 事件。
    // 该事件只适用于 <div> 元素。
    // submit() 方法触发 submit 事件，或规定当发生 submit 事件时运行的函数。
    $form_add_task.on('submit', on_add_task_form_submit);//监听添加清单‘submit’按钮，触发添加清单函数
    $task_detail_mask.on('click', hide_task_detail);//监听清单详情蒙版，通过点击，触发隐藏清单详情函数

    // 删除提示信息
    function pop(arg){
        if(!arg) {
            console.error('pop is required');
        }
        var conf = {},
            $box, //用于存储删除信息模块
            $mask, //用于存储删除信息蒙版
            $title, //用于存储删除信息模块中的标题：确定删除？
            $content, //用于存储删除信息的操作按钮模块
            $confirm, //用于存储删除信息的操作按钮模块中‘确定’按钮
            $cancel, //用于存储删除信息的操作按钮模块中‘取消’按钮
            dfd, 
            confirmed,//用于表示延迟对象的状态 
            timer;

        // 判断arg是否为字符串类型，如果是，则将arg赋值给conf.title
        if(typeof arg == 'string'){
            conf.title = arg;
        } else {
            conf = $.extend(conf, arg);
        }
        //$.Deferred() 是一个构造函数，用来返回一个链式实用对象方法来注册多个回调，并且调用回调队列，传递任何同步或异步功能成功或失败的状态。 
        //$.Deferred() 构造函数创建一个新的 Deferred（延迟）对象， 
        //jQuery.Deferred 可传递一个可选的函数，该函数在构造方法返回之前被调用并传递一个新的 Deferred 对象作为函数的第一个参数。
        dfd = $.Deferred();
        
        //删除信息模块
        $box = $('<div>' +
                    '<div class="pop-title">' + conf.title + '</div>' +
                    '<div class="pop-content">' +
                        '<div>' +
                            '<button style="margin-right:5px" class="primary confirm">确定</button>' +
                            '<button style="margin-left:5px" class="cancel">取消</button>' +
                        '</div>' +
                    '</div>' +
                '</div>').css({
            width           : 300,
            height          : 'auto',
            padding         : '15px 10px',
            color           : '#444',
            background      : '#fff',
            position        : 'fixed',
            'border-radius' : 3,
            'box-shadow'    : '0 1px 2px rgba(0,0,0,0.5)'
        });
        //删除信息模块中的标题
        $title = $box.find('.pop-title').css({
            padding         : '5px 10px',
            'font-weight'   :900,
            'font-size'     :20,
            'text-align'    : 'center',
        })
        //删除信息的操作按钮模块
        $content = $box.find('.pop-content').css({
            padding         : '5px 10px',
            'text-align'    : 'center'
        })
        //删除信息蒙版
        $mask = $('<div></div>').css({
            position        : 'fixed',
            background      : 'rgba(0,0,0,0.5)',
            top:0, bottom:0, right:0, left:0,
        })
        //删除信息的操作按钮模块中‘确定’按钮
        $confirm = $content.find('button.confirm');
        //删除信息的操作按钮模块中‘取消’按钮
        $cancel  = $content.find('button.cancel');

        timer = setInterval(function(){
            if(confirmed !== undefined){
                //deferred对象有三种执行状态----未完成，已完成和已失败。
                //  如果执行状态是"已完成"（resolved）,deferred对象立刻调用done()方法指定的回调函数；
                //  如果执行状态是"已失败"，调用fail()方法指定的回调函数；
                //  如果执行状态是"未完成"，则继续等待
                //当延迟对象被 resolved 时，任何通过 deferred.then或deferred.done 添加的 doneCallbacks，都会被调用。
                //dtd.resolve()的意思是，将dtd对象的执行状态从"未完成"改为"已完成"，从而触发done()方法。
                //deferred.reject()方法，作用是将dtd对象的执行状态从"未完成"改为"已失败"，从而触发fail()方法。
                dfd.resolve(confirmed);
                clearInterval(timer);
                dismiss_pop();//移出删除模块和删除蒙版
            }
        }, 50)
        $confirm.on('click', on_confiremd);//监听删除模块的确定按钮，将confirmed状态修改为true
        $cancel.on('click', on_cancel);//监听删除模块的取消按钮，将confirmed状态修改为false
        $mask.on('click', on_cancel);//监听删除模块蒙版，将confirmed状态修改为false
        function on_confiremd(){
            confirmed = true;
        }
        function on_cancel(){
            confirmed = false;
        }

        //移出删除模块和删除蒙版函数
        function dismiss_pop(){
            $mask.remove();
            $box.remove();
        }
        //将删除模块针对于浏览窗口居中
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
        //当调整浏览器窗口的大小时，发生 resize 事件。resize() 方法触发 resize 事件，或规定当发生 resize 事件时运行的函数。
        $window.on('resize', function(){
            adjust_box_position();
        })
        $mask.appendTo($body);
        $box.appendTo($body);
        $window.resize();//打开窗口时，浏览器窗口大小没有调整，所以删除模块不会居中，直接调用，用于第一次删除模块居中
        //deferred.promise()方法。
        //          它的作用是，在原来的deferred对象上返回另一个deferred对象，
        //          后者只开放与改变执行状态无关的方法（比如done()方法和fail()方法），
        //          屏蔽与改变执行状态有关的方法（比如resolve()方法和reject()方法），从而使得执行状态不能被改变。
        // deferred.promise() 没有参数时，返回一个新的deferred对象，该对象的运行状态无法被改变；接受参数时，作用为在参数对象上部署deferred接口。
        // deferred.promise() 函数返回 Deferred(延迟)的 Promise 对象,
        //                    方法允许一个异步函数阻止那些干涉其内部请求的进度（progress）或状态（status）的其它代码
        //Promise （承诺）对象仅会暴露那些需要绑定额外的处理或判断状态的延迟方法(then, done, fail, always, pipe, progress, state，和 promise)时，
        //                      并不会暴露任何用于改变状态的延迟方法(resolve, reject, notify, resolveWith, rejectWith, 和 notifyWith).
        //如果您要创建一个Deferred(延迟)，并且保持这个Deferred(延迟)的引用，以便它可以在一些点来解决或拒绝。
        //通过deferred.promise()定义Promise（承诺）对象即可。这样的话，其它的代码就可以注册回调函数或检查当前状态。
        //   // 返回 Promise 对象，调用者不能改变延迟对象
        return dfd.promise();
    }
    
    //通过监听清单提醒信息中‘知道了’的按钮，隐藏清单通知信息
    function listen_msg_event(){
        $msg_confirm.on('click', function(){
            //隐藏清单通知信息
            hide_msg();
        })
    }

    // 清单添加函数
    function on_add_task_form_submit(e){
        var new_task = {};//定义存储清单的对象
        // preventDefault() 方法阻止元素发生默认的行为（例如，当点击提交按钮时阻止对表单的提交）
        e.preventDefault();// 阻止from元素自动提交行为
        // 获取新task的值
        var $input = $(this).find('input[name=content]');//获取输入的清单的标题内容的input元素，$(this)指向form元素
        // contents() 方法获得匹配元素集合中每个元素的子节点，包括文本和注释节点。
        new_task.content = $input.val();
        // 如果新task的值为空，则直接返回，否则继续执行
        if(!new_task.content){
            return;
        }
        // 存入新task，如果存入了，则将清单输入的input的值置为空  
        //add_task函数为将新添加的清单放入清单显示区域，并返回bool值
        if(add_task(new_task)){
            // render_task_list();
            $input.val('');
        }
    }

    //监听打开详情事件
    function listen_task_detail(){
        //双击单条清单，显示详情
        $('.task-item').on('dblclick', function(){
            var index = $(this).data('index');//获取当前清单的index值
            show_task_detail(index);//查看当前清单的详情信息
        });
        //监听单条Task详细操作  $task_detail_trigger为单条清单的‘详情’按钮
        $task_detail_trigger.on('click', function(){
            var $this = $(this); //$this指向为单条清单‘详情’按钮
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
        // 显示详情模板区域和详情蒙版，默认隐藏
        $task_detail.show();
        $task_detail_mask.show();
    }
    //隐藏Task详情--隐藏详情模板区域和详情蒙版
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
        $update_form               = $task_detail.find('form');//用于存储清单详情区域form元素，$task_detail为//获取清单详情区域
        $task_detail_content       = $update_form.find('.content');//用于存储清单详情区域中清单标题元素 div.content
        $task_detail_content_input = $update_form.find('[name=content]');//用于存储清单详情区域中清单标题元素 input[name="content"] 作用：修改标题，双击标题变为输入框     
        //双击内容元素，显示input输入框，用于修改标题，隐藏已有标题
        $task_detail_content.on('dblclick', function(){
            $task_detail_content_input.show();
            $task_detail_content.hide();
        })

        $update_form.on('submit', function(e){
            e.preventDefault();//阻止form元素的默认提交行为
            var data = {};//用于存储清单详情中的数据，可用于更新清单内容
            //获取清单详情表单中各个input的值
            data.content     = $(this).find('[name=content]').val();//清单标题
            data.desc        = $(this).find('[name=desc]').val();//清单描述
            data.remain_date = $(this).find('[name=remain_date]').val();//清单时间
            update_task(index, data);//更新task清单 index为当前单挑清单的index值，data为当前清单详情中的值
            hide_task_detail();// 隐藏清单详情
        })    
    }

    // 查找并监听所有删除按钮的点击事件
    function listen_task_delete(){
        // $task_delete_trigger定义单条清单‘删除’按钮
        $task_delete_trigger.on('click', function(){
            var $this = $(this);
            // 找到删除按钮所在的task清单元素
            var $item = $this.parent().parent();
            var index = $item.data('index');
            // 确认删除
            pop('确定删除？').then(function(r){
                //delete_task 删除task清单
                r ? delete_task(index) : null;
            });
        });
    }

    // 监听完成任务事件 $checkbox_complete为用于存储单条清单前的选择框
    function listen_checkbox_complete(){
        $checkbox_complete.on('click', function(){
            var $this = $(this);
            // var is_complete = $this.is(':checked'); 
            var index       = $this.parent().parent().data('index');
            var item        = get(index);// 获取缓存中当前的单条清单
            // 如果存在清单,以完成，complete的值更新为true；如果未完成则为false
            if(item.complete){
                update_task(index, {complete: false});//更新Task
            } else {
                update_task(index, {complete: true});  
            }
        })
    }

    // 获取缓存中当前的单条清单
    function get(index){
        return store.get('task_list')[index];
    }

    // add_task函数将新添加的清单放入清单显示区域
    function add_task(new_task){
        // 将新task推入task_list  task_list为定义清单列表数据数组
        task_list.push(new_task);
        // 更新localStrage
        refresh_task_list();
        return true;
    }

    //刷新localStorage数据并渲染view
    function refresh_task_list(){
        store.set('task_list', task_list);
        render_task_list(); // 渲染所有task清单模板
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
        listen_msg_event(); //监听清单提醒信息中‘知道了’的按钮，隐藏清单通知信息
        if(task_list.length){
            render_task_list();// 渲染所有task模板
        }
        task_remind_check();
    }

    // 轮询监听清单时间
    function task_remind_check(){
        var current_timestamp;
        var itl = setInterval(function(){
            for(var i = 0; i < task_list.length; i++){
                var item = get(i),
                    task_timestamp;
                //item为清单数据，item.remain_date为清单时间
                if(!item || !item.remain_date || item.informed){ 
                    continue;
                }
                current_timestamp = (new Date()).getTime(); //获取当前时间的日期和时间距 1970 年 1 月 1 日午夜（GMT 时间）之间的毫秒数。
                task_timestamp = (new Date(item.remain_date)).getTime();//获取清单中指定的日期和时间距 1970 年 1 月 1 日午夜（GMT 时间）之间的毫秒数。
                if(current_timestamp - task_timestamp >=1){
                    update_task(i, {informed: true});//更新task，informed为表示清单是否已经提醒
                    show_msg(item.content);//显示清单提示信息
                }
            }
        }, 300);
       
    }

    //显示提醒区域，默认隐藏
    function show_msg(msg){
        if(!msg) return;
        $msg_content.html(msg); // $msg_content为清单提醒区域内容的标题 div.mgs span.msg-content
        $alerter.get(0).play();//获取清单提醒音频
        $msg.show(); //显示提醒区域，默认隐藏
    }
    
    // 隐藏提醒区域
    function hide_msg(){
        $msg.hide();
    }  

    // 渲染所有task模板
    function render_task_list(){
        var $task_list = $('.task-list');//获取清单列表显示区域的div
        $task_list.html('');//将清单列表显示区域置空
        var complete_items = [];//用于存储已完成清单
        for(var i = 0; i < task_list.length; i++){
            var item = task_list[i];
            // item.complete 为标识清单是否完成  如果完成complete的值更新为true；如果未完成则为false
            // 如果如果item存在，并且其为已完成清单，存储于complete_items中
            if(item && item.complete){
                complete_items[i] = item;
            } else {
                //render_task_item  渲染单条task清单
                var $task = render_task_item(item, i);
            }
            // prepend() 方法在被选元素的开头（仍位于内部）插入指定内容。
            $task_list.prepend($task);
            
        }

        // 渲染已完成的清单列表
        for(var j = 0; j < complete_items.length; j++){
            $task = render_task_item(complete_items[j], j);
            if(!$task) continue;
            $task.addClass('completed');//添加class = “completed”
            $task_list.append($task);
        }

        $task_delete_trigger = $('.action.delete');//获取单条清单的删除按钮
        $task_detail_trigger = $('.action.detail');//获取单条清单的详情按钮
        $checkbox_complete   = $('.task-list .complete[type=checkbox]');//获取单条清单前的选择框
        listen_task_delete();// 查找并监听所有删除按钮的点击事件
        listen_task_detail();// 监听打开详情事件
        listen_checkbox_complete();// 监听完成任务事件 
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