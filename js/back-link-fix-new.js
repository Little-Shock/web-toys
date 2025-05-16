/**
 * 修复项目页面中的返回链接
 *
 * 问题原因：
 * 在移动端浏览器中，使用相对路径的返回链接（如 "../index.html"）可能导致
 * 用户返回主页后无法再次点击项目链接。这个脚本将返回链接修改为正确的相对路径。
 */

document.addEventListener('DOMContentLoaded', function() {
    // 修复返回链接
    fixBackLink();
});

/**
 * 修复返回主菜单的链接
 */
function fixBackLink() {
    // 获取返回链接元素
    const backLink = document.querySelector('.back-link');

    if (!backLink) {
        console.log('未找到返回链接');
        return;
    }

    // 获取当前路径深度
    const pathSegments = window.location.pathname.split('/').filter(segment => segment.length > 0);
    
    // 计算返回主页需要的相对路径
    // 例如：如果当前路径是 /projects/category/project/index.html，则需要 ../../../index.html
    let relativePath = '';
    
    // 计算项目文件夹的深度
    // 注意：我们假设所有项目都在 projects 文件夹下的二级或三级目录中
    const projectDepth = pathSegments.length;
    
    // 如果路径中包含 "projects"，则计算返回主页的相对路径
    if (pathSegments.includes('projects')) {
        // 从当前位置到根目录的路径
        for (let i = 0; i < projectDepth - 1; i++) {
            relativePath += '../';
        }
        relativePath += 'index.html';
    } else {
        // 如果不在项目路径中，使用默认的相对路径
        relativePath = '../index.html';
    }

    // 修改返回链接的href属性
    backLink.setAttribute('href', relativePath);

    // 添加点击事件处理
    backLink.addEventListener('click', function(e) {
        // 阻止默认行为
        e.preventDefault();
        
        // 使用相对URL导航
        window.location.href = relativePath;
    });
    
    console.log('返回链接已修复，指向：', relativePath);
}
