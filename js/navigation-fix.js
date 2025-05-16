/**
 * 修复移动端浏览器返回主页后无法再次点击链接的问题
 *
 * 问题原因：
 * 在移动端浏览器中，当用户从项目页面点击"返回主菜单"链接回到主页后，
 * 再次点击项目链接可能无法正常导航，需要重新加载整个网站。
 * 这通常是由于浏览器历史记录和相对路径处理的问题。
 */

document.addEventListener('DOMContentLoaded', function() {
    // 检查URL参数，如果有时间戳参数，说明是从项目页面返回的
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('t')) {
        // 清除URL参数，但不刷新页面
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 修复所有项目链接
    fixProjectLinks();
});

/**
 * 修复所有项目链接，确保它们使用绝对路径
 */
function fixProjectLinks() {
    // 获取所有项目链接
    const projectLinks = document.querySelectorAll('.toy-link');

    projectLinks.forEach(link => {
        // 获取原始href
        const originalHref = link.getAttribute('href');

        // 构建绝对URL
        const absoluteUrl = new URL(originalHref, window.location.origin + '/').href;

        // 修改链接的href属性为绝对路径
        link.setAttribute('href', absoluteUrl);

        // 添加点击事件处理，确保链接正常工作
        link.addEventListener('click', function(e) {
            // 不阻止默认行为，让浏览器正常导航
            // 但记录一个标记到sessionStorage，表示这是一个正常的导航
            sessionStorage.setItem('navigatingToProject', 'true');
        });
    });

    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // 在移动设备上添加额外的处理
    if (isMobile) {
        // 监听页面可见性变化，处理返回按钮导致的问题
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                // 页面重新可见时，检查是否需要刷新
                const needsRefresh = sessionStorage.getItem('needsRefreshOnReturn');
                if (needsRefresh === 'true') {
                    sessionStorage.removeItem('needsRefreshOnReturn');
                    // 添加一个短暂延迟，确保页面完全可见后再刷新
                    setTimeout(function() {
                        window.location.reload();
                    }, 100);
                }
            }
        });

        // 在用户离开页面时设置标记
        window.addEventListener('pagehide', function() {
            // 如果用户是通过点击项目链接离开的，不需要在返回时刷新
            if (sessionStorage.getItem('navigatingToProject') === 'true') {
                sessionStorage.removeItem('navigatingToProject');
            } else {
                // 否则，在返回时可能需要刷新
                sessionStorage.setItem('needsRefreshOnReturn', 'true');
            }
        });
    }
}
