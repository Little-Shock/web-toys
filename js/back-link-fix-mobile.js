/**
 * 修复移动端项目页面中的返回链接
 * 
 * 问题原因：
 * 在移动端浏览器中，使用相对路径的返回链接可能导致
 * 用户返回主页后无法再次点击项目链接，或者在移动端自动返回主页。
 * 这个脚本将修复这些问题。
 */

document.addEventListener('DOMContentLoaded', function() {
    // 修复返回链接
    fixBackLink();
});

/**
 * 修复返回主菜单的链接
 */
function fixBackLink() {
    // 获取返回链接元素 - 支持多种可能的返回按钮选择器
    const backLink = document.querySelector('.back-link') || 
                     document.querySelector('.back-button') || 
                     document.querySelector('#backBtn') ||
                     document.querySelector('[id*="back"]') ||
                     document.querySelector('[class*="back"]');

    if (!backLink) {
        console.log('未找到返回链接');
        return;
    }

    // 获取原始href
    const originalHref = backLink.getAttribute('href');

    // 构建绝对URL - 无论原始链接是什么，都使用根路径
    const absoluteUrl = window.location.origin + '/';

    // 修改返回链接的href属性
    backLink.setAttribute('href', absoluteUrl);

    // 添加点击事件处理
    backLink.addEventListener('click', function(e) {
        // 阻止默认行为
        e.preventDefault();

        // 在URL中添加一个时间戳参数，确保主页刷新
        const timestamp = new Date().getTime();
        const urlWithTimestamp = absoluteUrl + '?t=' + timestamp;

        // 使用绝对URL导航
        window.location.href = urlWithTimestamp;
    });
}
