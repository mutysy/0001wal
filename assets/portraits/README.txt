青云界 · 立绘替换说明
==================================================

把 PNG 图片放进这个文件夹，刷新游戏就会自动替换掉内置绘制的立绘。
文件名必须完全一致（区分大小写）。放进去后如果没生效，按 Ctrl+Shift+R 强制刷新。

【立绘】推荐 720 × 960（3:4），PNG 透明背景，人物居中、头顶留一点空间。
头像会自动从图片上部约一半的位置裁一个圆，所以脸别太靠下。

  p_sword.png        玩家 · 剑修
  p_mage.png         玩家 · 法修
  p_body.png         玩家 · 体修
  p_alch.png         玩家 · 丹修
  npc_master.png     玄清子（青石村执事）
  npc_alchemist.png  苏青萝（药庐主人）
  npc_smith.png      雷九斤（铁匠）
  npc_young.png      阿七（杂役弟子）
  npc_angler.png     柳翁（湖畔钓叟）
  npc_guard.png      李行舟（守山弟子）

【角色形象】世界里走动的小人，放在 ..\sprites\ 文件夹。
推荐 256 × 320，PNG 透明背景，正面站立即可（游戏会自动左右镜像）。
同样这些文件名：

  p_sword.png / p_mage.png / p_body.png / p_alch.png
  npc_master.png / npc_alchemist.png / npc_smith.png
  npc_young.png / npc_angler.png / npc_guard.png

【没放图片会怎样】
自动使用游戏内置的程序化绘制，不会有任何报错或空白。

【版权提醒】
请使用你自己画的、买的、或明确允许商用的素材（CC0 / 已购买授权）。
网上随手存的角色立绘基本都有版权，公开部署到 Netlify 有被投诉下架的风险。

【怎么确认生效】
游戏里打开 http://你的地址/?debug=art ，会列出每个槽位是否已读到图片。
