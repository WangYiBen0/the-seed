// Invasion art direction: salvaged camp tools, containment equipment and lab samples.
// Stable combat IDs deliberately stay independent from display names and artwork.
'use strict';
const IV_WEAPON_ART = {};
for (const row of `
fist|铆钉拳套|Riveted Knuckles|punch
edge|废钢砍刀|Scrap Machete|blade
axe|破门消防斧|Breach Axe|axe
hammer|拆墙重锤|Demolition Sledge|hammer
baton|隔离电棍|Containment Baton|baton
chainsaw|清障链锯|Clearing Chainsaw|saw
scythe|弯刃割草镰|Reaping Hook|scythe
lance|钢筋长矛|Rebar Pike|spear
whip|配重锁链|Weighted Chain|chain
nail|工地射钉器|Pneumatic Nailer|nail
scatter|泵动霰弹枪|Pump Shotgun|pellet
storm|改装冲锋枪|Salvaged Auto|bullet
longshot|哨塔狙击枪|Watchtower Rifle|sniper
bow|滑轮猎弩|Compound Crossbow|bolt
rail|线圈穿甲炮|Coil Railgun|rail
bloom|肩扛火箭筒|Shoulder Launcher|rocket
cluster|转轮榴弹器|Drum Grenadier|grenade
flamer|焚烧喷射器|Decontaminator|flame
volt|高压电弧枪|Arc Projector|arc
frostbite|液氮喷射枪|Cryogenic Projector|crystal
shuriken|离心切割片|Centrifuge Blades|disc
harpoon|倒刺锚枪|Barbed Anchor Gun|harpoon
leech|采血针枪|Blood Sampler|needle
glue|封堵发泡枪|Sealant Sprayer|glob
deploy|抢修管钳|Emergency Pipe Wrench|pipewrench
drill|矿用钻弹枪|Mining Drillgun|drill
cacti_club|破片狼牙棒|Shard Studded Club|club
chopper|重型剁骨刀|Bone Cleaver|cleaver
claw|解剖钢爪|Dissection Claws|claw
ghost_flint|样本剥离斧|Sample Splitter|hatchet
hand|液压推掌|Hydraulic Palm|hand
jousting_lance|冲压长枪|Ram Lance|lance
knife|野战匕首|Field Knife|knife
lightning_shiv|电容短刃|Capacitor Shiv|shiv
plank|爆破钉板|Demolition Plank|plank
pruner|苗圃修枝剪|Nursery Pruners|pruner
rock|混凝土残块|Concrete Chunk|rock
scissors|外科剪|Surgical Shears|scissors
screwdriver|绝缘螺丝刀|Insulated Driver|driver
sharp_tooth|异变獠牙|Mutant Fang|tooth
spiky_shield|钉刺防暴盾|Spiked Riot Shield|shield
stick|缠布木棍|Wrapped Timber|stick
thief_dagger|拆解刺刀|Salvager Bayonet|dagger
torch|应急燃烧棒|Emergency Flare|torch
wrench|工程扳手|Engineer Wrench|wrench
crossbow|折叠钢弩|Folding Crossbow|bolt
double_barrel_shotgun|短管双筒枪|Sawed Off Double|pellet
ghost_scepter|活体取样枪|Living Tissue Sampler|plasma
laser_gun|实验切割激光|Lab Cutting Laser|laser
pistol|营地制式手枪|Camp Sidearm|bullet
revolver|巡逻左轮|Patrol Revolver|heavy
shredder|破片弹发射器|Fragment Launcher|shell
slingshot|废土弹弓|Wasteland Sling|stone
smg|警卫冲锋枪|Guard SMG|bullet
taser|接触电击枪|Stun Projector|shock
wand|磷火投射器|Phosphor Projector|ember
`.trim().split('\n')) { const [id,zh,en,fx]=row.split('|'); IV_WEAPON_ART[id]={zh,en,fx}; }

// Each row chooses an actual object silhouette, a material and a physical attachment.
// These are not stat glyphs. Variant controls the construction of the object.
const IV_ITEM_ART = {};
for (const row of `
acid|腐蚀酸罐|Corrosive Canister|canister|lime|hose|0
adrenaline|急救肾上腺素|Adrenaline Injector|syringe|red|cross|0
alien_baby|胚体培养舱|Embryo Incubator|tank|lime|embryo|0
alien_eyes|复眼标本|Compound Eye Sample|jar|red|eyes|0
alien_magic|活性孢子瓶|Active Spore Flask|flask|lime|bubbles|0
alien_tongue|伸缩组织|Extensible Tissue|tray|rose|tongue|0
alien_worm|寄生虫标本|Parasite Sample|jar|amber|worm|1
alloy|复合合金|Composite Alloy|ingot|steel|rivets|0
anvil|营地锻台|Camp Anvil|anvil|steel|hammer|0
baby_elephant|重载牵引器|Heavy Winch|winch|amber|hook|0
baby_gecko|壁虎仿生夹|Gecko Grip|clamp|lime|pads|0
baby_with_a_beard|遗骸破片器|Remains Fragmenter|hopper|rust|blades|0
bag|拾荒背包|Scavenger Pack|pack|olive|strap|0
bait|诱食肉块|Bait Ration|meat|rose|hook|0
ball_and_chain|囚禁配重|Restraint Weight|ballchain|steel|shackle|0
bandana|穿透导套|Penetrator Sleeve|sleeve|amber|bullet|0
banner|营地战旗|Camp Standard|flag|red|patch|0
barricade|钢板路障|Steel Barricade|barricade|steel|warning|0
bat|蝠翼血清|Bat Serum|vial|rose|wing|0
bean_teacher|学习植入体|Learning Implant|chip|lime|roots|0
beanie|保暖针织帽|Wool Cap|cap|olive|stitch|0
big_arms|增力臂架|Strength Braces|arms|steel|piston|0
black_belt|格斗腰带|Combat Belt|belt|steel|buckle|0
blazemander|焚焰蜥|Blaze Lizard|crawler|rust|tank|0
blindfold|遮光眼罩|Blackout Visor|goggles|steel|cloth|0
blood_donation|定量采血泵|Blood Metering Pump|pump|red|bloodbag|0
blood_leech|血液过滤虫|Blood Filter Leech|dish|red|worm|0
bloody_hand|血泵义手|Blood Pump Gauntlet|glove|red|hose|0
boiling_water|高温蒸馏器|Hot Distiller|kettle|steel|steam|0
bonk_dog|冲撞猎犬|Ram Hound|quadruped|amber|ram|0
book|实验手册|Lab Manual|book|olive|label|0
bot_o_mine|布雷巡卫|Mine Sentry|tracks|amber|mine|0
bowler_hat|硬壳作业帽|Rigid Work Hat|helmet|olive|brim|0
boxing_glove|缓冲拳套|Impact Glove|glove|rust|pad|1
broken_mouth|破损呼吸器|Damaged Respirator|mask|steel|crack|0
butterfly|蝶翼神经片|Wing Nerve Sample|tray|amber|wing|1
cake|压缩能量糕|Energy Ration|ration|cream|layers|0
campfire|便携炉架|Portable Stove|stove|rust|flame|0
candle|应急蜡烛|Emergency Candle|candle|cream|flame|0
candy_bag|葡萄糖补给袋|Glucose Pouch|pouch|amber|tablets|0
cape|防尘斗篷|Dust Cloak|cloak|olive|hood|0
catling_gun|机枪伴猫|Gunner Cat|walker|steel|barrels|0
celery_tea|镇静草本剂|Herbal Sedative|bottle|lime|leaf|0
chameleon|自适应伪装布|Adaptive Camo|cloth|olive|scales|0
charcoal|活性炭滤芯|Carbon Filter|filter|steel|charcoal|0
claw_tree|收割机械臂|Harvest Manipulator|arm|steel|claw|0
clockwork_wasp|发条针刺蜂|Clockwork Stinger|drone|amber|needle|0
clover|四叶草标本|Clover Specimen|pressed|lime|clover|0
coffee|浓缩咖啡罐|Coffee Tin|tin|rust|steam|0
cog|传动齿轮|Drive Gear|gear|steel|hub|0
coil|高压线圈|High Voltage Coil|coil|copper|spark|0
community_support|营地对讲机|Camp Radio|radio|olive|antenna|0
compass|野外罗盘|Field Compass|dial|amber|needle|0
coupon|补给配额券|Supply Voucher|ticket|cream|stamp|0
crown|收获调度终端|Harvest Terminal|terminal|amber|antenna|0
cute_monkey|自动包扎臂|Bandaging Arm|arm|cream|bandage|1
cyberball|电荷球发生器|Charge Sphere|orb|cyan|coil|0
cyclops_worm|单眼寄生体|Cyclops Parasite|jar|rose|oneeye|2
dangerous_bunny|物资抽签器|Supply Lottery|hopper|amber|ticket|1
decomposing_flesh|坏死组织盒|Necrotic Tissue|tray|olive|meat|2
defective_steroids|失效强化剂|Degraded Enhancer|syringe|olive|crack|1
diploma|旧研究员证|Researcher ID|badge|cream|photo|0
doc_moth|医护翼蛾|Medic Moth|drone|cream|cross|1
duct_tape|工业胶带|Industrial Tape|tape|steel|tail|0
dynamite|爆破药卷|Demolition Charges|dynamite|red|fuse|0
energy_bracelet|储能腕环|Energy Cuff|cuff|cyan|cell|0
esty_s_couch|营地折叠床|Camp Cot|cot|olive|pillow|0
exoskeleton|负重外骨骼|Load Exoskeleton|exo|steel|piston|0
explosive_shells|高爆弹匣|Explosive Magazine|magazine|rust|shells|0
explosive_turret|爆破炮台|Demolition Turret|turret|rust|mortar|0
extra_stomach|消化辅助囊|Digestive Sac|organ|rose|hose|0
eyes_surgery|眼科改造套组|Optic Surgery Kit|kit|cyan|lens|0
fertilizer|营养肥料袋|Fertilizer Sack|sack|olive|leaf|0
fairy|再生微机群|Regeneration Swarm|swarm|cyan|cross|0
fin|推进鳍组件|Propulsion Fins|fins|steel|bolts|0
focus|稳态瞄准模块|Stability Module|optic|cyan|crosshair|0
fresh_meat|冷藏鲜肉|Chilled Ration|meat|red|label|1
fried_rice|军用餐盒|Field Meal|lunchbox|olive|rice|0
frozen_heart|低温循环心泵|Cryogenic Heart Pump|heartpump|cyan|ice|0
fruit_basket|营地采收筐|Harvest Basket|basket|olive|fruit|0
fuel_tank|加压燃料罐|Pressurized Fuel|tank|rust|hose|1
gambling_token|营地赌筹|Camp Token|coin|copper|slots|0
garden|水培种植箱|Hydroponic Bed|planter|lime|pipe|0
gentle_alien|稳定异变组织|Stable Mutant Tissue|tank|rose|embryo|2
ghost_outfit|折光隔离服|Refractive Hazmat|suit|cyan|visor|0
giant_belt|巨力承重带|Heavy Support Belt|belt|rust|chains|1
glass_cannon|脆壳增幅器|Glass Amplifier|amplifier|cyan|crack|0
glasses|校准护目镜|Calibration Glasses|goggles|cream|lens|1
gnome|维修微型机|Maintenance Unit|walker|olive|wrench|1
goat_skull|异兽颅骨|Mutant Skull|skull|cream|horns|0
gobbler_s_hat|代谢调节头盔|Metabolic Helmet|helmet|lime|hose|1
greek_fire|附着燃烧剂|Adhesive Incendiary|bottle|rust|flame|1
grind_s_magical_leaf|增殖培养叶|Replicating Leaf|pressed|lime|roots|1
gummy_berserker|狂暴凝胶|Frenzy Gel|jar|red|bubbles|3
handcuffs|限容腕铐|Limiter Cuffs|cuffs|steel|lock|0
head_injury|颅骨固定架|Cranial Brace|headbrace|rust|bandage|0
heavy_bullets|加重弹芯|Heavy Slugs|bullets|steel|weight|0
hedgehog|反冲针甲|Recoil Spine Plate|plate|rust|spines|0
helmet|防暴头盔|Riot Helmet|helmet|steel|visor|2
honey|抗菌蜂蜜罐|Antiseptic Honey|jar|amber|honey|4
hourglass|沙漏计时器|Sand Timer|hourglass|copper|sand|0
hunting_trophy|猎获识别牌|Hunt Tag|dogtag|steel|claw|0
ice_cube|低温凝块|Cryogenic Block|ice|cyan|crack|0
improved_tools|精密工具组|Precision Tools|toolroll|steel|driver|0
incendiary_turret|焚烧炮台|Incinerator Turret|turret|rust|tank|1
injection|强化注射器|Enhancer Injector|syringe|cyan|cell|2
insanity|失控神经束|Unstable Nerves|organ|rose|spark|1
jelly|营养凝胶包|Nutrient Gel|pouch|lime|window|1
jellyshield|护罩水母|Shield Jelly|hover|cyan|shield|0
jet_pack|双罐推进背包|Twin Jet Pack|jetpack|rust|flame|0
landmines|感应地雷|Proximity Mines|mine|olive|sensor|0
laser_turret|切割激光塔|Cutting Laser Turret|turret|cyan|lens|2
leather_vest|旧皮护甲|Leather Vest|vest|rust|stitch|0
lemonade|电解质饮料|Electrolyte Drink|bottle|amber|lemon|2
lens|聚焦透镜|Focusing Lens|lens|cyan|frame|0
little_frog|弹跳辅助器|Jump Assist|spring|lime|foot|0
little_muscley_dude|肌纤维束|Muscle Fiber Bundle|organ|red|fiber|2
lootworm|寻物蠕虫|Salvage Worm|crawler|olive|magnet|1
lost_duck|失联信标|Lost Beacon|beacon|amber|antenna|0
lucky_charm|幸存者护符|Survivor Keepsake|pendant|copper|clover|0
lucky_coin|旧世界硬币|Old World Coin|coin|amber|star|1
lure|电讯诱饵|Signal Decoy|beacon|red|speaker|1
lumberjack_shirt|伐木工装|Forester Jacket|jacket|rust|checks|0
mammoth|重型负重架|Heavy Hauling Frame|frame|steel|tusks|0
mastery|战斗训练记录|Combat Records|book|red|target|1
medal|守营勋章|Camp Defense Medal|medal|amber|star|0
medical_turret|医护支援台|Medical Station|turret|cream|cross|3
medikit|野战急救包|Field Medikit|kit|cream|cross|1
metal_detector|金属探测器|Metal Detector|detector|amber|dial|0
metal_plate|装甲钢板|Armor Plate|plate|steel|rivets|1
missile|制导弹体|Guided Missile|missile|rust|fins|0
mouse|微型侦测鼠|Scout Mouse Bot|crawler|steel|ears|2
mushroom|真菌培养皿|Fungal Culture|dish|olive|fungus|1
mutation|突变试剂|Mutation Reagent|vial|lime|dna|1
nail|工业钢钉|Industrial Nails|nails|steel|bundle|0
night_goggles|双筒夜视仪|Night Optics|goggles|lime|tubes|2
octopus|多触臂样本|Multi Limb Sample|tank|rose|tentacles|3
padding|缓冲衬垫|Impact Padding|pad|olive|quilt|0
panda|重型护胸|Heavy Chest Guard|vest|cream|plates|1
peaceful_bee|授粉微型机|Pollinator Drone|drone|amber|pollen|2
peacock|虹膜诱导器|Iris Inducer|iris|cyan|fan|0
pencil|测绘铅笔|Survey Pencil|pencil|amber|ruler|0
piggy_bank|零件储蓄箱|Parts Safe|safe|olive|slot|0
pile_of_books|工程资料堆|Engineering Archive|books|olive|ruler|0
plant|营地幼苗|Camp Seedling|plant|lime|leaf|0
plastic_explosive|塑胶炸药|Plastic Explosive|charge|olive|timer|0
poisonous_tonic|毒性强化液|Toxic Tonic|bottle|lime|skull|3
pocket_factory|便携制造机|Portable Fabricator|printer|steel|gear|0
potato|储备种薯|Reserve Seed Tuber|roots|amber|sprout|0
power_generator|便携发电机|Portable Generator|generator|rust|coil|0
propeller_hat|头戴助推器|Head Thruster|helmet|amber|propeller|3
pumpkin|穿透校准弹|Penetration Calibrator|bullets|amber|caliper|1
ratzilla|巨齿清障鼠|Clearance Rat|quadruped|steel|teeth|1
recycling_machine|废料回收机|Scrap Recycler|hopper|olive|gear|2
regeneration_potion|组织再生液|Tissue Regenerator|flask|rose|cross|1
reinforced_steel|加强钢梁|Reinforced Beam|beam|steel|rivets|0
retromation_s_hoodie|敏捷作战服|Agility Jacket|jacket|steel|cable|1
ricochet|偏转弹芯|Deflection Core|bullets|cyan|angled|2
rip_and_tear|组织撕裂器|Tissue Ripper|cutter|rust|teeth|0
riposte|反击触发器|Counter Trigger|switch|amber|spring|0
ritual|试验流程板|Procedure Board|clipboard|cream|diagram|0
robot_arm|工业机械臂|Industrial Arm|arm|amber|piston|2
sad_tomato|充血培养体|Congested Culture|dish|red|organ|2
scapegoat|诱敌山羊|Decoy Goat|quadruped|cream|speaker|2
scar|缝合补片|Suture Patch|patch|rose|stitch|0
scared_sausage|易燃催化胶|Combustion Catalyst|tube|rust|flame|0
scope|远距瞄准镜|Long Range Scope|scope|steel|lens|0
shackles|步速限位器|Stride Limiter|cuffs|rust|chain|1
shady_potion|未标记试剂|Unmarked Reagent|flask|olive|question|2
sharp_bullet|尖头穿甲弹|Pointed Penetrator|bullets|steel|tip|3
shmoop|膨胀缓冲囊|Inflatable Cushion|bladder|rose|valve|0
sifd_s_relic|广域回收磁芯|Wide Area Magnet|magnet|cyan|coil|0
silver_bullet|银芯净化弹|Silver Purifier|bullets|cream|cross|4
small_magazine|轻量弹匣|Light Magazine|magazine|steel|window|1
snail|黏液减速剂|Viscous Inhibitor|canister|olive|drip|1
snake|链式引燃管|Chain Ignition Tube|hose|rust|spark|0
snowball|霜凝蓄能球|Frost Accumulator|orb|cyan|ice|1
spicy_sauce|催化辣素剂|Capsaicin Catalyst|bottle|red|pepper|4
spider|八足助力架|Eight Leg Assist|exo|steel|legs|1
statue|驻守稳定座|Stationary Stabilizer|base|steel|clamp|0
strange_book|异常实验笔记|Anomaly Notes|book|rose|eye|2
stone_skin|矿化皮层|Mineralized Skin|plate|olive|crack|2
sunglasses|防眩镜|Anti Glare Glasses|goggles|steel|shade|3
tardigrade|休眠保护舱|Dormancy Capsule|capsule|olive|shield|0
tentacle|再生触须|Regrowing Tendril|tray|rose|tentacles|3
terrified_onion|刺激腺体|Irritant Gland|organ|amber|veins|3
toolbox|维修工具箱|Repair Toolbox|toolbox|rust|wrench|0
torture|疼痛反馈机|Pain Feedback Unit|pump|red|electrodes|1
toxic_sludge|污染废液桶|Toxic Waste Drum|drum|olive|drip|0
tractor|牵引动力组|Hauling Motor|engine|rust|tracks|0
tree|根系培养槽|Root Culture Bed|planter|olive|roots|1
triangle_of_power|三相增幅芯|Three Phase Core|triangle|amber|cell|0
turret|营地机枪塔|Camp Gun Turret|turret|steel|barrel|4
tyler|电环守卫|Arc Sentinel|turret|cyan|ring|5
ugly_tooth|迟缓毒牙|Inhibitor Fang|tooth|cream|drip|0
vigilante_ring|守夜记录环|Night Watch Ring|cuff|amber|ticks|1
wandering_bot|巡回抑制机|Roaming Suppressor|hover|steel|antenna|1
warrior_helmet|突击面罩|Assault Mask|mask|rust|plates|1
weird_food|异变口粮|Mutated Ration|ration|olive|eyes|1
weird_ghost|休克刺激器|Shock Stimulator|defib|cyan|electrodes|0
wheat|种子封存袋|Seed Reserve|sack|amber|wheat|1
wheelbarrow|拾荒手推车|Salvage Barrow|barrow|olive|load|0
whetstone|磨刃油石|Oiled Whetstone|stone|steel|blade|0
white_flag|停战信号旗|Truce Signal|flag|cream|plain|1
will_o_wisp|冷焰探照灯|Cold Flame Lamp|lantern|cyan|flame|0
wings|助滑折叠翼|Folding Glider|wings|cream|struts|0
wisdom|战术演算器|Tactical Computer|terminal|cyan|graph|1
wolf_helmet|追猎传感盔|Tracking Helmet|helmet|steel|ears|4
`.trim().split('\n')) { const [id,zh,en,form,accent,detail,variant]=row.split('|'); IV_ITEM_ART[id]={zh,en,form,accent,detail,v:+variant}; }

IV_WEAPON_ART.medical_gun={zh:'创伤注射枪',en:'Trauma Injector',fx:'needle'};
for (const id of IV_W_IDS) { const a=IV_WEAPON_ART[id]; if(!a)throw Error('Missing invasion weapon art: '+id); IV_W[id].n=IZ(a.en,a.zh); }
for (const id of IV_I_IDS) { const a=IV_ITEM_ART[id]; if(!a)throw Error('Missing invasion item art: '+id); IV_I[id].n=IZ(a.en,a.zh); }
// Descriptions mention other equipment; keep those references consistent with the shop.
const ivThemeNames=IV_I_IDS.map(id=>[IV_BASE_ITEMS[id].zh,IV_ITEM_ART[id].zh]).filter(([a,b])=>a!==b).sort((a,b)=>b[0].length-a[0].length);
for(const it of Object.values(IV_I))for(const [oldName,newName] of ivThemeNames)it.desc=it.desc.split(oldName).join(newName);
IV_ROLES[1].lines[1]='额外携带1副铆钉拳套'; IV_ROLES[2].lines[2]='额外携带1把野战匕首';
IV_ROLES[3].lines[0]='范围＋50，额外携带1把营地制式手枪'; IV_ROLES[4].lines[1]='开局携带链式引燃管、易燃催化胶';
IV_SETS.ethereal.n=IZ('BIOACTIVE','活体'); IV_SETS.medieval.n=IZ('SALVAGED','回收');
