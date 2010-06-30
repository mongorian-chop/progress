$(document).ready(function (){
    $(".list tbody tr").hover(function(){
        $(this).addClass('ui-state-hover');
    }, function(){
        $(this).removeClass('ui-state-hover');
    });
    $(".menu .submenu span").toggle(function(){
        $(".submenu ul").css('display', 'block');
    }, function(){
        $(".submenu ul").css('display', 'none');
    });
});
