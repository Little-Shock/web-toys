/**
 * 轨道跟踪器
 * 负责创建和更新天体轨道的可视化
 */
class OrbitTracer {
  /**
   * 创建轨道跟踪器
   * @param {THREE.Scene} scene - Three.js场景
   */
  constructor(scene) {
    this.scene = scene;
    this.trailObjects = new Map(); // 存储每个天体的轨迹对象
    this.enabled = true;
    this.maxTrailLength = 500;
    this.trailWidth = 2;
  }

  /**
   * 为天体创建轨迹对象
   * @param {CelestialBody} body - 天体
   * @param {string} color - 轨迹颜色
   */
  createTrailForBody(body, color) {
    try {
      // 如果已经有轨迹对象，先移除
      if (this.trailObjects.has(body)) {
        this.removeTrail(body);
      }

      // 创建轨迹几何体
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(this.maxTrailLength * 3); // 每个点3个坐标
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // 设置绘制模式为线条
      geometry.setDrawRange(0, 0);

      // 创建轨迹材质
      const material = new THREE.LineBasicMaterial({
        color: color || body.baseColor,
        linewidth: this.trailWidth,
        transparent: true,
        opacity: 0.7
      });

      // 创建线条对象
      const trail = new THREE.Line(geometry, material);
      this.scene.add(trail);

      // 存储轨迹对象
      this.trailObjects.set(body, {
        line: trail,
        positions: positions,
        count: 0
      });
    } catch (error) {
      console.error('创建轨迹对象时出错:', error);
      // 继续执行，不要因为轨迹创建失败而中断整个应用
    }
  }

  /**
   * 更新天体轨迹
   * @param {CelestialBody} body - 天体
   */
  updateTrail(body) {
    try {
      if (!this.enabled || !this.trailObjects.has(body)) return;

      const trailObj = this.trailObjects.get(body);
      const positions = trailObj.positions;

      // 添加当前位置到轨迹
      if (trailObj.count < this.maxTrailLength) {
        // 还有空间，直接添加
        const index = trailObj.count * 3;
        positions[index] = body.position.x;
        positions[index + 1] = body.position.y;
        positions[index + 2] = body.position.z;
        trailObj.count++;
      } else {
        // 已满，移动所有点并添加新点
        for (let i = 0; i < this.maxTrailLength - 1; i++) {
          const currentIndex = i * 3;
          const nextIndex = (i + 1) * 3;
          positions[currentIndex] = positions[nextIndex];
          positions[currentIndex + 1] = positions[nextIndex + 1];
          positions[currentIndex + 2] = positions[nextIndex + 2];
        }

        // 添加新点到末尾
        const lastIndex = (this.maxTrailLength - 1) * 3;
        positions[lastIndex] = body.position.x;
        positions[lastIndex + 1] = body.position.y;
        positions[lastIndex + 2] = body.position.z;
      }

      // 更新几何体
      trailObj.line.geometry.attributes.position.needsUpdate = true;
      trailObj.line.geometry.setDrawRange(0, trailObj.count);
    } catch (error) {
      console.error('更新轨迹时出错:', error);
      // 继续执行，不要因为轨迹更新失败而中断整个应用
    }
  }

  /**
   * 清除天体轨迹
   * @param {CelestialBody} body - 天体
   */
  clearTrail(body) {
    if (!this.trailObjects.has(body)) return;

    const trailObj = this.trailObjects.get(body);
    trailObj.count = 0;
    trailObj.line.geometry.setDrawRange(0, 0);
  }

  /**
   * 移除天体轨迹
   * @param {CelestialBody} body - 天体
   */
  removeTrail(body) {
    if (!this.trailObjects.has(body)) return;

    const trailObj = this.trailObjects.get(body);
    this.scene.remove(trailObj.line);
    trailObj.line.geometry.dispose();
    trailObj.line.material.dispose();
    this.trailObjects.delete(body);
  }

  /**
   * 设置轨迹最大长度
   * @param {number} length - 轨迹最大长度
   */
  setMaxTrailLength(length) {
    // 如果长度没有变化，直接返回
    if (this.maxTrailLength === length) return;

    this.maxTrailLength = length;

    // 更新所有轨迹对象
    for (const [body, trailObj] of this.trailObjects.entries()) {
      // 创建新的几何体
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(length * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // 复制现有点
      const copyCount = Math.min(trailObj.count, length);
      for (let i = 0; i < copyCount; i++) {
        const oldIndex = i * 3;
        const newIndex = i * 3;
        positions[newIndex] = trailObj.positions[oldIndex];
        positions[newIndex + 1] = trailObj.positions[oldIndex + 1];
        positions[newIndex + 2] = trailObj.positions[oldIndex + 2];
      }

      // 更新几何体
      geometry.setDrawRange(0, copyCount);

      // 替换旧的几何体
      trailObj.line.geometry.dispose();
      trailObj.line.geometry = geometry;
      trailObj.positions = positions;
      trailObj.count = copyCount;
    }
  }

  /**
   * 设置轨迹宽度
   * @param {number} width - 轨迹宽度
   */
  setTrailWidth(width) {
    this.trailWidth = width;

    // 更新所有轨迹对象的线宽
    for (const [body, trailObj] of this.trailObjects.entries()) {
      trailObj.line.material.linewidth = width;
    }
  }

  /**
   * 设置轨迹颜色
   * @param {CelestialBody} body - 天体
   * @param {string} color - 轨迹颜色
   */
  setTrailColor(body, color) {
    if (!this.trailObjects.has(body)) return;

    const trailObj = this.trailObjects.get(body);
    trailObj.line.material.color.set(color);
  }

  /**
   * 设置轨迹可见性
   * @param {boolean} visible - 是否可见
   */
  setVisible(visible) {
    for (const [body, trailObj] of this.trailObjects.entries()) {
      trailObj.line.visible = visible;
    }
  }

  /**
   * 启用或禁用轨迹跟踪
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.setVisible(enabled);
  }

  /**
   * 更新所有轨迹
   * @param {Array} bodies - 天体数组
   */
  update(bodies) {
    if (!this.enabled) return;

    for (const body of bodies) {
      // 如果天体没有轨迹对象，创建一个
      if (!this.trailObjects.has(body)) {
        this.createTrailForBody(body, body.baseColor);
      }

      // 更新轨迹
      this.updateTrail(body);
    }
  }

  /**
   * 清除所有轨迹
   */
  clearAllTrails() {
    for (const [body, _] of this.trailObjects.entries()) {
      this.clearTrail(body);
    }
  }

  /**
   * 移除所有轨迹
   */
  removeAllTrails() {
    for (const [body, _] of this.trailObjects.entries()) {
      this.removeTrail(body);
    }
  }
}
