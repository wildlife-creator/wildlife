class TimeManager {
  // 現実1分 = ゲーム内1時間
  // 60fps × 60秒 = 3600フレームで1ゲーム時間（60分）進む
  // 1フレームあたりのゲーム内経過分数
  static MINUTES_PER_FRAME = 60 / (60 * 60);

  // ゲーム開始時刻（分換算: 6:00 = 360分）
  static START_TIME = 6 * 60;

  // 1日の分数
  static MINUTES_PER_DAY = 24 * 60;

  constructor() {
    // ゲーム内の経過分数（0:00からの通算分）
    this.timeOfDay = TimeManager.START_TIME;
    this.day = 1;
  }

  update() {
    this.timeOfDay += TimeManager.MINUTES_PER_FRAME;

    // 日付が変わった場合
    if (this.timeOfDay >= TimeManager.MINUTES_PER_DAY) {
      this.timeOfDay -= TimeManager.MINUTES_PER_DAY;
      this.day++;
    }
  }

  // 現在の時（0〜23）
  getHour() {
    return Math.floor(this.timeOfDay / 60);
  }

  // 現在の分（0〜59）
  getMinute() {
    return Math.floor(this.timeOfDay % 60);
  }

  // 翌朝6:00まで時間を進める
  skipToMorning() {
    this.timeOfDay = TimeManager.START_TIME;
    this.day++;
  }

  // 表示用の時刻文字列（例: "14:00"）
  getTimeString() {
    const h = String(this.getHour()).padStart(2, '0');
    const m = String(this.getMinute()).padStart(2, '0');
    return `${h}:${m}`;
  }

  // 表示用の日付＋時刻文字列（例: "Day 1 - 14:00"）
  getDisplayString() {
    return `Day ${this.day} - ${this.getTimeString()}`;
  }

  // 時間帯に応じたオーバーレイ情報を返す
  // { color: 'rgba(...)', opacity: 0〜1 }
  getOverlay() {
    const hour = this.timeOfDay / 60; // 小数点付きの時間

    // 昼 8:00〜17:00 → オーバーレイなし
    if (hour >= 8 && hour < 17) {
      return { color: null, opacity: 0 };
    }

    // 朝 6:00〜8:00 → 徐々に明るくなる（暗→明）
    if (hour >= 6 && hour < 8) {
      const progress = (hour - 6) / 2; // 0→1
      const opacity = 0.4 * (1 - progress);
      return { color: `rgba(0, 0, 30, ${opacity})`, opacity };
    }

    // 夕方 17:00〜19:00 → 徐々に暗くなる、オレンジがかる
    if (hour >= 17 && hour < 19) {
      const progress = (hour - 17) / 2; // 0→1
      // 前半はオレンジ、後半は暗くなる
      if (progress < 0.5) {
        const orangeOpacity = progress * 0.3;
        return { color: `rgba(180, 80, 0, ${orangeOpacity})`, opacity: orangeOpacity };
      } else {
        const darkOpacity = 0.15 + (progress - 0.5) * 0.5;
        return { color: `rgba(0, 0, 30, ${darkOpacity})`, opacity: darkOpacity };
      }
    }

    // 夜 19:00〜6:00 → 暗い
    return { color: 'rgba(0, 0, 30, 0.4)', opacity: 0.4 };
  }
}
