import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const QUESTIONS_PER_RUN = 2

type Q = {
  question_text: string
  option_a: string
  option_b: string
  category: string
  duration_minutes: number
}

const BANK: Q[] = [
  // 愛情
  { question_text: '喜歡一個人要不要主動告白？', option_a: '主動出擊', option_b: '等對方', category: '愛情', duration_minutes: 1440 },
  { question_text: '分手後多久可以開始下一段感情？', option_a: '立刻也沒關係', option_b: '至少要等半年', category: '愛情', duration_minutes: 1440 },
  { question_text: '遠距離戀愛值得嗎？', option_a: '值得', option_b: '不值得', category: '愛情', duration_minutes: 1440 },
  { question_text: '約會誰付錢比較合適？', option_a: '男生付', option_b: '各付各的', category: '愛情', duration_minutes: 1440 },
  { question_text: '被已讀不回是不是暗示沒興趣？', option_a: '就是沒興趣', option_b: '可能只是忙', category: '愛情', duration_minutes: 720 },
  { question_text: '跟前任能當朋友嗎？', option_a: '可以', option_b: '不可能真的只是朋友', category: '愛情', duration_minutes: 1440 },
  { question_text: '情侶之間需要查對方手機嗎？', option_a: '不需要，信任就好', option_b: '透明才安心', category: '愛情', duration_minutes: 1440 },
  { question_text: '你覺得「喜歡」和「愛」差在哪？', option_a: '喜歡是選擇，愛是責任', option_b: '其實沒差，感覺到就是了', category: '愛情', duration_minutes: 2880 },
  { question_text: '另一半跟前任還在聯絡，可以接受嗎？', option_a: '可以，信任他', option_b: '不行，太危險', category: '愛情', duration_minutes: 1440 },
  { question_text: '戀愛中誰先說「我愛你」比較好？', option_a: '先說的勇氣值得讚', option_b: '等對方先說比較安全', category: '愛情', duration_minutes: 1440 },
  { question_text: '你會接受有過很多段感情的對象嗎？', option_a: '可以，過去不重要', option_b: '有點介意', category: '愛情', duration_minutes: 1440 },
  { question_text: '喜歡一個人，要不要先調查他的感情狀況？', option_a: '當然要先確認', option_b: '直接告白看反應', category: '愛情', duration_minutes: 720 },
  { question_text: '結婚前要不要先同居試試？', option_a: '要，先了解生活習慣', option_b: '不用，結婚再說', category: '愛情', duration_minutes: 2880 },
  { question_text: '你比較希望另一半是：', option_a: '活潑外向型', option_b: '安靜沉穩型', category: '愛情', duration_minutes: 1440 },
  { question_text: '情侶吵架，誰應該先道歉？', option_a: '先冷靜下來的人', option_b: '造成問題的那個', category: '愛情', duration_minutes: 720 },

  // 職場
  { question_text: '加薪還是更有意義的工作，你選哪個？', option_a: '加薪', option_b: '有意義的工作', category: '職場', duration_minutes: 1440 },
  { question_text: '剛畢業應該先求穩定還是挑戰自己？', option_a: '求穩定', option_b: '挑戰自己', category: '職場', duration_minutes: 1440 },
  { question_text: '在公司被排擠，你會選擇？', option_a: '直接換工作', option_b: '想辦法融入', category: '職場', duration_minutes: 1440 },
  { question_text: '老闆情緒勒索，你的反應是？', option_a: '忍著繼續做', option_b: '直接辭職', category: '職場', duration_minutes: 1440 },
  { question_text: '同事搶功勞，你會怎麼做？', option_a: '直接跟主管說清楚', option_b: '忍了，等機會', category: '職場', duration_minutes: 720 },
  { question_text: '你比較想要哪種工作模式？', option_a: '完全在家遠端', option_b: '每天進辦公室', category: '職場', duration_minutes: 1440 },
  { question_text: '年薪百萬但每天加班到十二點，值得嗎？', option_a: '值得', option_b: '不值得', category: '職場', duration_minutes: 1440 },
  { question_text: '你覺得「做自己喜歡的事」可以賺到錢嗎？', option_a: '可以，熱情會帶來機會', option_b: '很難，現實要考慮', category: '職場', duration_minutes: 2880 },
  { question_text: '工作上犯了錯，你第一個反應是？', option_a: '馬上承認跟主管說', option_b: '先自己想辦法補救', category: '職場', duration_minutes: 720 },
  { question_text: '你覺得創業比上班更值得嗎？', option_a: '創業，掌控自己的命運', option_b: '上班，穩定最重要', category: '職場', duration_minutes: 1440 },

  // 購物
  { question_text: '雙11購物節你會衝動購物嗎？', option_a: '會，反正便宜', option_b: '不會，都是假折扣', category: '購物', duration_minutes: 720 },
  { question_text: '買名牌包划算嗎？', option_a: '划算，保值又有品味', option_b: '不划算，普通包就好', category: '購物', duration_minutes: 1440 },
  { question_text: '你比較傾向線上購物還是實體店？', option_a: '線上購物', option_b: '實體店摸過才放心', category: '購物', duration_minutes: 1440 },
  { question_text: '同樣品質，貴的和便宜的你選哪個？', option_a: '貴的，一分錢一分貨', option_b: '便宜的，省錢才是王道', category: '購物', duration_minutes: 1440 },
  { question_text: '你會因為「限量」而衝動購買嗎？', option_a: '會，怕錯過', option_b: '不會，都是行銷手段', category: '購物', duration_minutes: 720 },
  { question_text: '買東西前你會做功課比價嗎？', option_a: '一定會仔細研究', option_b: '覺得差不多就買了', category: '購物', duration_minutes: 1440 },
  { question_text: '路邊攤的食物你敢買嗎？', option_a: '敢，就是要吃這種', option_b: '有點猶豫衛生問題', category: '購物', duration_minutes: 720 },

  // 生活
  { question_text: '你算是夜貓族還是早鳥族？', option_a: '夜貓族，夜晚才是我的時間', option_b: '早鳥族，早起效率高', category: '生活', duration_minutes: 1440 },
  { question_text: '手機沒電在外面，你的心情是？', option_a: '超焦慮，立刻找插座', option_b: '還好，就放空一下', category: '生活', duration_minutes: 720 },
  { question_text: '週末你比較想做什麼？', option_a: '出去玩，充電', option_b: '在家躺平，也是充電', category: '生活', duration_minutes: 1440 },
  { question_text: '你喜歡一個人住還是和朋友同住？', option_a: '一個人住，自由', option_b: '和朋友住，不孤單', category: '生活', duration_minutes: 1440 },
  { question_text: '下班後你通常做什麼？', option_a: '追劇滑手機', option_b: '運動或培養興趣', category: '生活', duration_minutes: 1440 },
  { question_text: '你會整理自己的房間嗎？', option_a: '定期整理，整潔最重要', option_b: '有自己的邏輯，亂中有序', category: '生活', duration_minutes: 1440 },
  { question_text: '遇到陌生人問路，你會怎麼做？', option_a: '熱心帶路', option_b: '指路就好，不帶路', category: '生活', duration_minutes: 720 },
  { question_text: '你覺得「做自己」和「顧及他人感受」哪個優先？', option_a: '做自己優先', option_b: '顧及他人優先', category: '生活', duration_minutes: 2880 },
  { question_text: '你是容易感到無聊的人嗎？', option_a: '是，一直需要新刺激', option_b: '不是，自己一個人也ok', category: '生活', duration_minutes: 1440 },
  { question_text: '你會在意別人對你的看法嗎？', option_a: '會，還是在意的', option_b: '不會，活好自己最重要', category: '生活', duration_minutes: 1440 },
  { question_text: '你相信「緣分」這件事嗎？', option_a: '相信，有些事就是天注定', option_b: '不信，一切靠自己爭取', category: '生活', duration_minutes: 2880 },
  { question_text: '生日你比較希望怎麼過？', option_a: '一群人熱鬧慶祝', option_b: '安靜地和最親近的人', category: '生活', duration_minutes: 1440 },
  { question_text: '你有在記帳的習慣嗎？', option_a: '有，每筆都記', option_b: '沒有，靠感覺控制', category: '生活', duration_minutes: 1440 },

  // 旅遊
  { question_text: '出去玩你更喜歡哪種？', option_a: '自由行，隨性最好', option_b: '跟團，省心有保障', category: '旅遊', duration_minutes: 1440 },
  { question_text: '旅遊你更在意哪個？', option_a: '住得好（飯店品質）', option_b: '吃得好（在地美食）', category: '旅遊', duration_minutes: 1440 },
  { question_text: '你喜歡國內旅遊還是出國玩？', option_a: '出國，開眼界', option_b: '國內，省錢輕鬆', category: '旅遊', duration_minutes: 1440 },
  { question_text: '旅行時你喜歡排滿行程還是隨興走？', option_a: '排好排滿，效率最大', option_b: '隨興走，才叫旅行', category: '旅遊', duration_minutes: 1440 },
  { question_text: '一個人旅行你敢嗎？', option_a: '敢，很期待', option_b: '有點不安，還是找人陪', category: '旅遊', duration_minutes: 1440 },
  { question_text: '旅遊最重要的是什麼？', option_a: '美景體驗', option_b: '美食探索', category: '旅遊', duration_minutes: 2880 },
  { question_text: '你更想去哪種地方旅遊？', option_a: '日本、韓國等亞洲', option_b: '歐美等遠程目的地', category: '旅遊', duration_minutes: 1440 },

  // 美食
  { question_text: '消夜要吃什麼？', option_a: '鹹食（麵、滷味）', option_b: '甜食（冰、蛋糕）', category: '美食', duration_minutes: 720 },
  { question_text: '珍奶你喝哪種？', option_a: '全糖去冰', option_b: '少糖少冰', category: '美食', duration_minutes: 720 },
  { question_text: '你是鐵板燒派還是燒肉派？', option_a: '鐵板燒', option_b: '燒肉', category: '美食', duration_minutes: 1440 },
  { question_text: '吃火鍋你偏好哪種湯底？', option_a: '麻辣鍋', option_b: '清湯/昆布', category: '美食', duration_minutes: 1440 },
  { question_text: '早餐你選哪個？', option_a: '燒餅蛋餅等傳統早餐', option_b: '吐司三明治咖啡', category: '美食', duration_minutes: 720 },
  { question_text: '你是甜食黨還是鹹食黨？', option_a: '甜食黨', option_b: '鹹食黨', category: '美食', duration_minutes: 1440 },
  { question_text: '你的理想午餐是？', option_a: '便當快速解決', option_b: '好好坐下來吃一頓', category: '美食', duration_minutes: 720 },
  { question_text: '你比較喜歡哪種料理？', option_a: '台式料理', option_b: '日式料理', category: '美食', duration_minutes: 1440 },
  { question_text: '吃到飽還是點菜，你選哪個？', option_a: '吃到飽，要吃回本', option_b: '點菜，精準點自己想吃的', category: '美食', duration_minutes: 1440 },
  { question_text: '喝飲料你習慣自帶環保杯嗎？', option_a: '習慣了，環保也省錢', option_b: '偶爾，沒帶就算了', category: '美食', duration_minutes: 1440 },

  // 健康
  { question_text: '你有在運動的習慣嗎？', option_a: '有，每週至少3次', option_b: '沒有，一直說要開始', category: '健康', duration_minutes: 1440 },
  { question_text: '睡眠不足，你用哪個補回來？', option_a: '早點睡補眠', option_b: '喝咖啡撐過去', category: '健康', duration_minutes: 720 },
  { question_text: '你覺得精神健康比身體健康重要嗎？', option_a: '一樣重要，不分先後', option_b: '身體健康是基礎', category: '健康', duration_minutes: 2880 },
  { question_text: '你每天喝夠水嗎（2000ml）？', option_a: '有，養成習慣了', option_b: '沒有，都靠飲料補', category: '健康', duration_minutes: 1440 },
  { question_text: '你更傾向去哪裡運動？', option_a: '健身房', option_b: '戶外跑步或公園', category: '健康', duration_minutes: 1440 },
  { question_text: '熬夜隔天你怎麼恢復狀態？', option_a: '補眠到自然醒', option_b: '強撐熬過當天晚上再正常睡', category: '健康', duration_minutes: 720 },
  { question_text: '你相信吃保健食品有用嗎？', option_a: '有用，有吃有差', option_b: '沒差，均衡飲食就夠了', category: '健康', duration_minutes: 1440 },

  // 科技
  { question_text: 'iPhone還是Android，你是哪派？', option_a: 'iPhone（iOS）', option_b: 'Android', category: '科技', duration_minutes: 1440 },
  { question_text: '你覺得AI會取代你的工作嗎？', option_a: '會，要趕快轉型', option_b: '不會，人還是有不可取代的地方', category: '科技', duration_minutes: 2880 },
  { question_text: '社群媒體對你來說是？', option_a: '必需品，沒有不行', option_b: '有點上癮但可以戒', category: '科技', duration_minutes: 1440 },
  { question_text: '你每天花多少時間滑手機？', option_a: '3小時以下，算節制', option_b: '超過3小時，知道不好但戒不掉', category: '科技', duration_minutes: 1440 },
  { question_text: '你用AI工具（ChatGPT等）嗎？', option_a: '常用，提升很多效率', option_b: '偶爾，不太依賴', category: '科技', duration_minutes: 1440 },
  { question_text: '你支持完全無現金化（全用手機支付）嗎？', option_a: '支持，方便又衛生', option_b: '不支持，現金還是要保留', category: '科技', duration_minutes: 2880 },
  { question_text: '你是Mac還是Windows用戶？', option_a: 'Mac', option_b: 'Windows', category: '科技', duration_minutes: 1440 },
  { question_text: '你有在用任何健康追蹤裝置嗎（手環/手錶）？', option_a: '有，數據讓我更注意健康', option_b: '沒有，感覺沒必要', category: '科技', duration_minutes: 1440 },

  // 運動
  { question_text: '你比較喜歡哪種運動？', option_a: '室內（健身、瑜珈）', option_b: '室外（跑步、登山）', category: '運動', duration_minutes: 1440 },
  { question_text: '你會看運動直播嗎？', option_a: '會，很熱血', option_b: '不會，不太追運動', category: '運動', duration_minutes: 1440 },
  { question_text: '打球你偏好哪種？', option_a: '籃球', option_b: '羽毛球', category: '運動', duration_minutes: 1440 },
  { question_text: '你認為職業運動員的薪水合理嗎？', option_a: '合理，他們很努力', option_b: '太高了，比例失衡', category: '運動', duration_minutes: 2880 },
  { question_text: '你覺得運動最重要的是？', option_a: '持之以恆的習慣', option_b: '找到自己喜歡的項目', category: '運動', duration_minutes: 1440 },

  // 其他（社會話題、時事）
  { question_text: '你覺得台灣的物價貴嗎？', option_a: '太貴了，薪水跟不上', option_b: '還好，比其他地方便宜', category: '其他', duration_minutes: 1440 },
  { question_text: '你支持週休三日嗎？', option_a: '支持，生活品質更重要', option_b: '不一定，薪資結構要先談', category: '其他', duration_minutes: 2880 },
  { question_text: '你覺得台灣年輕人買得起房嗎？', option_a: '在台北幾乎不可能', option_b: '努力存錢加上地點選擇是可以的', category: '其他', duration_minutes: 2880 },
  { question_text: '你比較擔心哪個問題？', option_a: '氣候變遷', option_b: '經濟不景氣', category: '其他', duration_minutes: 2880 },
  { question_text: '你覺得現在網紅比藝人更有影響力嗎？', option_a: '是，流量就是影響力', option_b: '不是，藝人還是更有魅力', category: '其他', duration_minutes: 1440 },
  { question_text: '你覺得現在社會壓力比上一代大嗎？', option_a: '更大，選項多但壓力也更多', option_b: '其實差不多，只是不同的壓力', category: '其他', duration_minutes: 2880 },
  { question_text: '你相信「努力就會成功」這句話嗎？', option_a: '相信，努力是基本條件', option_b: '不完全相信，運氣和資源也很重要', category: '其他', duration_minutes: 2880 },
  { question_text: '你覺得現在的年輕人比較物質還是比較注重體驗？', option_a: '注重體驗（旅遊、美食、活動）', option_b: '還是很物質（包包、手機、品牌）', category: '其他', duration_minutes: 2880 },
  { question_text: '你認為人的個性是天生的還是後天塑造的？', option_a: '天生的居多', option_b: '後天環境影響更大', category: '其他', duration_minutes: 2880 },
  { question_text: '你覺得「內卷」現象在台灣嚴重嗎？', option_a: '很嚴重，大家都在瘋狂比較', option_b: '還好，沒有對岸那麼誇張', category: '其他', duration_minutes: 2880 },
]

function pickRandom(arr: Q[], n: number, excludeTexts: Set<string>): Q[] {
  const pool = arr.filter(q => !excludeTexts.has(q.question_text))
  const result: Q[] = []
  const used = new Set<number>()
  const attempts = pool.length * 3
  let i = 0
  while (result.length < n && i < attempts) {
    const idx = Math.floor(Math.random() * pool.length)
    if (!used.has(idx)) { used.add(idx); result.push(pool[idx]) }
    i++
  }
  return result
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const botUserId = process.env.BOT_USER_ID
  if (!botUserId) return NextResponse.json({ error: 'BOT_USER_ID not set' }, { status: 500 })

  const admin = createAdminClient()

  // Avoid repeating questions posted in the last 30 days
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recent } = await admin
    .from('questions')
    .select('question_text')
    .eq('user_id', botUserId)
    .gte('created_at', since)

  const recentTexts = new Set((recent ?? []).map(q => q.question_text))
  const picks = pickRandom(BANK, QUESTIONS_PER_RUN, recentTexts)

  if (picks.length === 0) {
    return NextResponse.json({ ok: true, posted: 0, note: 'No new questions available' })
  }

  const now = Date.now()
  const rows = picks.map((q, i) => ({
    user_id: botUserId,
    question_text: q.question_text,
    option_a: q.option_a,
    option_b: q.option_b,
    category: q.category,
    duration_minutes: q.duration_minutes,
    status: 'active',
    image_urls: [],
    expires_at: new Date(now + q.duration_minutes * 60 * 1000 + i * 60 * 1000).toISOString(),
  }))

  const { error } = await admin.from('questions').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, posted: rows.length, questions: picks.map(q => q.question_text) })
}
