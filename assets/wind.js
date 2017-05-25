/**
 * Created by WINDNCC on 5/24/2017.
 */
$(document).ready(function () {
    $('.btn-menu-item').click(function (e) {
        $('.nav-tabs').hide();
    });
    $(window).keydown(function (e) {
        e.preventDefault();
       if (e.keyCode === 32){
           $('.tab-content').find('div.tab-pane').removeClass('active');
           $('.nav-tabs').show();
           $('.nav-tabs').find('li.active').removeClass('active');
       }
    });
});