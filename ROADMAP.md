# ROADMAP — Void Descent

> 原则：先把一个小垂直切片磨到非常好，再扩展内容量。

## Stage 0 — 工程基线
目标：让项目能够稳定开发几个月而不是越改越乱。

- [x] 导入当前可玩原型
- [x] 建立目录结构
- [ ] 拆分 simulation / rendering / data / ui
- [x] 增加基础静态检查
- [x] Render 部署配置
- [x] DEVLOG
- [x] Debug / FPS / entity 统计面板
- [x] 视觉常量与特效预算

**退出条件**：新增功能不再需要在一个巨型 JS 文件里到处改。

## Stage 1 — “壁纸感”视觉基线
目标：普通战斗截图就已经好看。

### 背景
- [x] 3 层以上视差星空
- [x] 程序化星云
- [x] 远景巨构
- [x] 相机轻漂移
- [x] 暗角 / 色调分级 / 颗粒
- [ ] Boss / 扇区状态改变背景

### 玩家
- [x] 有方向感的机体轮廓
- [x] 推进尾焰
- [x] 受击反馈
- [x] 护盾 / 无敌反馈
- [ ] 死亡溶解

### 战斗特效
- [x] 投射物拖尾
- [x] 命中冲击环
- [x] 敌人死亡基础粒子编排
- [x] 精英 aura / 视觉标识
- [x] 伤害数字层级
- [x] 震屏预算
- [ ] 特效质量档位

**退出条件**：随机截图看起来是“一个完整作品”，不是原型。

## Stage 2 — 战斗手感
- [x] 移动加速度 / 减速度
- [x] 冲刺与冷却
- [x] 敌人分离避免叠成一团
- [x] 接触受击击退
- [x] 远程预警攻击
- [x] 地面危险区
- [x] Encounter Director
- [x] 难度由 encounter budget 驱动

**退出条件**：只有少量敌人和武器时，连续玩 5 分钟仍然有乐趣。

## Stage 3 — 数据驱动构筑
- [ ] 武器数据表
- [x] 升级数据表
- [x] tag 系统
- [x] rarity
- [ ] 前置条件
- [ ] synergy
- [ ] keystone
- [ ] anomaly / cursed 强化
- [x] 当前 build 可视化

**退出条件**：可以不改核心战斗代码就增加新升级。

## Stage 4 — 第一个完整扇区
- [ ] Glass Expanse 背景与环境
- [ ] 5–7 敌人
- [ ] 2 类精英
- [ ] 1 个环境目标
- [ ] 1 个异常事件
- [ ] 1 个 Boss：The Observatory
- [ ] Boss 出场 / 二阶段 / 死亡演出

## Stage 5 — 首个完整构筑生态
- [ ] 3 个主武器
- [ ] 20+ 强化
- [ ] 6+ Keystone / 重大质变
- [ ] 状态协同
- [ ] 3 种明显可识别流派
- [ ] 构筑结算卡

## Stage 6 — 局外循环
- [ ] 机库主页
- [ ] 解锁条件
- [ ] 新机体
- [ ] 新武器
- [ ] Challenge modifiers
- [ ] Lore fragments
- [ ] 本地存档 schema 版本管理

## Stage 7 — 内容扩张
- [ ] Rose Nebula
- [ ] Black Meridian
- [ ] 更多 Boss
- [ ] 更多角色
- [ ] 更多武器
- [ ] 事件池
- [ ] 成就
- [ ] 难度层级

## Stage 8 — 发布前精修
- [ ] 音效与动态音乐
- [ ] 教程
- [ ] 设置 / 无障碍
- [ ] 手机 UI
- [ ] 手柄
- [ ] 加载与首屏
- [ ] 性能 profiling
- [ ] 浏览器兼容
- [ ] Render 生产部署
- [ ] 错误恢复 / 存档兼容

---

## 当前开发优先级

1. 继续 Stage 0 模块化：优先抽离 Encounter Director、Hazard simulation 和实体渲染。
2. 完成 Stage 1 剩余项：死亡溶解、Boss/扇区背景响应、特效质量档位。
3. 试玩并校准 Stage 2 的相位冲刺、预警、击退、危险区和遭遇预算。
4. Stage 3 已开始：继续做前置条件、synergy、Keystone 与真正的 Constellation Resonance。
