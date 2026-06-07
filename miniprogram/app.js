App({
  globalData: {
    favs: [],
    progressions: [],
    webaudio: null
  },
  onLaunch() {
    const favs = wx.getStorageSync('guitar_favs');
    const progs = wx.getStorageSync('guitar_progs');
    if (favs) this.globalData.favs = JSON.parse(favs);
    if (progs) this.globalData.progressions = JSON.parse(progs);
  }
});
