var HomeController = {
	options: {
		name: '/' // makes this controller the default route
	},
	index: (req, res) => {
		res.render('home/index');
	}
};

module.exports = HomeController;