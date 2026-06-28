// 30 秒家庭短剧 Demo 的分镜数据（旁白中文 + 拼音 + 越南语 + 场景 + 出场角色）
export const CHAR_REF = {
  boy: "plan/temp/_char-boy.png", // 黄帽衫胖娃
  girl: "plan/temp/_char-girl.png", // 珊瑚红裙胖娃
  dad: "plan/temp/_char-dad-keep.png", // 憨厚爸爸
  mom: "plan/temp/_char-momN3red.png", // 红裙瓜子脸妈妈（用户选定）
  dog: "plan/temp/_char-dogBull2.png", // 灰白英斗（用户选定）
};

export const beats = [
  {
    id: "p1",
    zh: "早晨，阳光照进小屋，胖乎乎的哥哥和妹妹醒来啦。",
    pinyin: "zǎochén, yángguāng zhào jìn xiǎo wū, pànghūhū de gēge hé mèimei xǐng lái la.",
    vi: "Buổi sáng, nắng chiếu vào nhà, anh trai và em gái mũm mĩm thức dậy rồi.",
    chars: ["boy", "girl"],
    scene:
      "a cozy little bedroom in soft warm morning sunlight; the chubby boy in the yellow hoodie and the chubby girl in the coral-red dress are just waking up, rubbing their eyes and stretching, sleepy and happy and cute",
  },
  {
    id: "p2",
    zh: "哥哥打开手机，跟着大声说：你好！",
    pinyin: "gēge dǎkāi shǒujī, gēnzhe dàshēng shuō: nǐ hǎo!",
    vi: "Anh trai mở điện thoại, đọc to theo: Xin chào!",
    chars: ["boy"],
    scene:
      "the chubby boy in the yellow hoodie holding a smartphone in both hands, mouth open speaking happily and confidently, cheerful and proud",
  },
  {
    id: "p3",
    zh: "妹妹也不甘示弱，奶声奶气地念：谢谢！",
    pinyin: "mèimei yě bùgān shìruò, nǎishēng nǎiqì de niàn: xièxie!",
    vi: "Em gái cũng không chịu kém, bi bô đọc theo: Cảm ơn!",
    chars: ["girl"],
    scene:
      "the chubby little girl in the coral-red dress standing cutely, mouth open speaking sweetly, little hands together, adorable and proud",
  },
  {
    id: "p4",
    zh: "爸爸竖起大拇指，妈妈端来香喷喷的早餐。",
    pinyin: "bàba shù qǐ dàmǔzhǐ, māma duān lái xiāngpēnpēn de zǎocān.",
    vi: "Bố giơ ngón tay cái, mẹ bưng tới bữa sáng thơm phức.",
    chars: ["dad", "mom"],
    scene:
      "the dad giving a big thumbs up with a warm proud smile, next to the pretty mom in the red dress carrying a tray with steaming breakfast bowls; a simple cozy kitchen",
  },
  {
    id: "p5",
    zh: "连小狗都歪着头，好像也想学说中文。",
    pinyin: "lián xiǎo gǒu dōu wāizhe tóu, hǎoxiàng yě xiǎng xué shuō zhōngwén.",
    vi: "Đến chú cún cũng nghiêng đầu, như muốn học nói tiếng Trung.",
    chars: ["dog"],
    scene:
      "the cute grey-and-white bulldog puppy tilting its head curiously to one side, big sweet eyes, as if listening and eager to learn",
  },
  {
    id: "p6",
    zh: "一家人每天一起学，中文越来越棒！",
    pinyin: "yìjiā rén měitiān yìqǐ xué, zhōngwén yuèláiyuè bàng!",
    vi: "Cả nhà mỗi ngày cùng học, tiếng Trung ngày càng giỏi!",
    chars: ["boy", "girl", "dad", "mom", "dog"],
    scene:
      "the whole happy family together — the dad, the pretty mom in the red dress, the chubby boy in yellow, the chubby girl in coral-red, and the little grey-and-white bulldog — all smiling warmly side by side, cozy togetherness",
  },
  {
    id: "p7",
    zh: "快和全家一起，轻松学中文吧！",
    pinyin: "kuài hé quánjiā yìqǐ, qīngsōng xué zhōngwén ba!",
    vi: "Hãy cùng cả nhà học tiếng Trung thật dễ dàng nào!",
    chars: ["boy", "girl"],
    scene:
      "the chubby boy in yellow and the chubby girl in coral-red waving happily at the viewer, joyful and inviting, cheerful celebratory mood with a few simple sparkle dots around them",
  },
];
