<!--
出图提示词组装模板（确定性拼接，非自由发挥）。
脚本按占位符替换后送模型：
  {shot}        ← 分镜给的"这张图画什么"（忠于原文，不脑补）
  {canon}       ← 在场主角色 canonical 描述（config/characters/<id>/canonical.md，多角色换行拼接）
  {style}       ← config/prompts/style.md
  {composition} ← config/prompts/composition.md
  {negative}    ← config/prompts/negative.md
无主角色的镜头 {canon} 留空，其余不变。改这个文件即改变全局出图规则。
-->
{shot}

Characters (keep them IDENTICAL to the reference images — same faces, hairstyles, clothes, colors and body shapes):
{canon}

Art style:
{style}

Composition:
{composition}

Avoid:
{negative}
