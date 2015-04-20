define(['tinybone/base', 'lodash',"tinybone/backadapter","safe", 'dustc!templates/database.dust', 'highcharts','jquery.tablesorter.combined'],function (tb,_,api, safe) {
    var view = tb.View;
    var View = view.extend({
        id:"templates/database",
        events: {
            'click .do-stats': function(e) {
                var self = this;
                $this = $(e.currentTarget);
                var h = window.location.pathname.split('/',5)
                this.app.router.navigateTo('/'+h[1]+'/'+h[2]+'/'+h[3]+"/"+h[4]+'/'+$this.data('sort'));
                return false;
            },
            'click .more': function(e) {
                var self = this;
                var trbreak = self.$('#trbreak')
                var p = $(e.currentTarget).html()
                var filter = this.data.fr
                filter.filter['data._s_name'] = p;

                safe.parallel([
                    function(cb) {
                        filter.filter['data._s_cat'] = "WebTransaction"
                        api("stats.getActionsCategoryBreakDown", $.cookie("token"), filter, safe.sure(cb, function(data) {
                            trbreak.remove();
                            self.$('.addtrbreak').append('<table class="tablesorter" id="trbreak">');
                            trbreak=self.$('#trbreak')
                            trbreak.append('<thead><tr class=\"info\"><th>Part</th><th>Count</th><th>Time</th></tr></thead><tbody>');
                            var sum = 0
                            _.forEach(data, function(r) {
                                sum += r.value.tta
                            })
                            _.forEach(data, function(r) {
                                var count = (r.value.cnt)
                                var proc = ((r.value.tta/sum)*100).toFixed(1)
                                trbreak.append('<tr><td>'+r._id+'</td><td>'+count+'</td><td>'+proc+' %</td></tr>')
                            })
                            trbreak.append('</tbody></table>')
							trbreak.tablesorter({sortList: [[2,1]]});
                        }))
                        cb()
                    },
                    function(cb) {
                        api("stats.getActionsCategoryTimings", $.cookie("token"), filter, safe.sure(cb, function(data) {
                            var views = data;
                            var flat = [], prev = null;
                            var quant = filter.quant;
                            var offset = new Date().getTimezoneOffset();
                            var dtstart = Math.round(new Date(self.data.fr.filter._dt.$gt).getTime()/(quant*60000));
                            var dtend =  Math.round(new Date(self.data.fr.filter._dt.$lte).getTime()/(quant*60000));
                            if (dtstart != views[0]._id) {
								flat[0]={_id: dtstart, value:null}
								flat[1]={_id: views[0]._id-1, value:null}
							}
                            _.each(views, function (a) {
                                if (prev) {
                                    for (var i = prev._id + 1; i < a._id; i++) {
                                        flat.push({_id: i, value: null});
                                    }
                                }
                                prev = a;
                                flat.push(a);
                            })
                             if (views[views.length-1]._id != dtend) {
								flat[flat.length]={_id: views[views.length-1]._id+1, value:null}
								flat[flat.length]={_id: dtend, value:null}
							}
                            var rpm1;
                            var rpm = [];
                            var ttBrowser = [];
                            _.each(flat, function (v) {
                                var d = new Date(v._id * quant * 60000);
                                d.setMinutes(d.getMinutes() - offset);
                                d = d.valueOf();
                                var rpm1 = v.value ? v.value.r : 0;
                                rpm.push([d, rpm1]);
                                ttBrowser.push([d, v.value?(v.value.tta/1000):0]);
                            })

                            var rpmmax = _.max(rpm, function (v) {
                                return v[1];
                            })[1];
                            var ttBrowserMax = _.max(ttBrowser, function (v) { return v[1]; })[1];

                            self.$('#rpm-one').highcharts({
                                chart: {
                                    type: 'spline',
                                    zoomType: 'x'
                                },
                                title: {
                                    text: ''
                                },
                                xAxis: {
                                    type: 'datetime'
                                },
                                yAxis: [{
                                    title: {
                                        text: 'Throughput (rpm)'
                                    },
                                    min: 0,
                                    max: rpmmax
                                }
                                ],
                                plotOptions: {
                                    series: {
                                        marker: {
                                            enabled: false
                                        },
                                        animation: false
                                    }
                                },
                                legend: {
                                    enabled: false
                                },
                                credits: {
									enabled: false
								},
                                series: [
                                    {
                                        name: 'rpm',
                                        yAxis: 0,
                                        data: rpm,
                                        color: "green",
                                        type: 'area',
                                        fillColor: {
                                            linearGradient: {
                                                x1: 0,
                                                y1: 0,
                                                x2: 0,
                                                y2: 1
                                            },
                                            stops: [
                                                [0, 'lightgreen'],
                                                [1, 'white']
                                            ]
                                        }
                                    }
                                ]
                            })
                            self.$('#time-one').highcharts({
                                chart: {
                                    type: 'spline',
                                    zoomType: 'x'
                                },
                                title: {
                                    text: ''
                                },
                                xAxis: {
                                    type: 'datetime'
                                },
                                yAxis: [{
                                    title: {
                                        text: 'Timing (s)'
                                    },
                                    min: 0,
                                    max: ttBrowserMax
                                }
                                ],
                                plotOptions: {
                                    series: {
                                        marker: {
                                            enabled: false
                                        },
                                        animation: false
                                    }
                                },
                                legend: {
                                    enabled: false
                                },
                                credits: {
									enabled: false
								},
                                series: [
                                    {
                                        name: 'time',
                                        yAxis: 0,
                                        data: ttBrowser,
                                        color: "blue",
                                        type: 'area',
                                        fillColor: {
                                            linearGradient: {
                                                x1: 0,
                                                y1: 0,
                                                x2: 0,
                                                y2: 1
                                            },
                                            stops: [
                                                [0, 'lightblue'],
                                                [1, 'white']
                                            ]
                                        }
                                    }
                                ]
                            })
                        }))
                        cb()
                    }
                ])
            }
        },
        postRender:function () {
            view.prototype.postRender.call(this);
            var self = this;
            var filter = this.data.fr;
            api("stats.getActionsCategoryTimings", $.cookie("token"), filter, safe.sure(this.app.errHandler, function(data) {
                            var views = data;
                            var flat = [], prev = null;
                            var quant = filter.quant;
                            var offset = new Date().getTimezoneOffset();
                            var dtstart = Math.round(new Date(self.data.fr.filter._dt.$gt).getTime()/(quant*60000));
                            var dtend =  Math.round(new Date(self.data.fr.filter._dt.$lte).getTime()/(quant*60000));
                            if (dtstart != views[0]._id) {
								flat[0]={_id: dtstart, value:null}
								flat[1]={_id: views[0]._id-1, value:null}
							}
                            _.each(views, function (a) {
                                if (prev) {
                                    for (var i = prev._id + 1; i < a._id; i++) {
                                        flat.push({_id: i, value: null});
                                    }
                                }
                                prev = a;
                                flat.push(a);
                            })
                            if (views[views.length-1]._id != dtend) {
								flat[flat.length]={_id: views[views.length-1]._id+1, value:null}
								flat[flat.length]={_id: dtend, value:null}
							}
                            var rpm1;
                            var rpm = [];
                            var ttBrowser = [];
                            _.each(flat, function (v) {
                                var d = new Date(v._id * quant * 60000);
                                d.setMinutes(d.getMinutes() - offset);
                                d = d.valueOf();
                                var rpm1 = v.value ? v.value.r : 0;
                                rpm.push([d, rpm1]);
                                ttBrowser.push([d, v.value?(v.value.tta/1000):0]);
                            })

                            var rpmmax = _.max(rpm, function (v) {
                                return v[1];
                            })[1];
                            var ttBrowserMax = _.max(ttBrowser, function (v) { return v[1]; })[1];

                            self.$('#rpm-one').highcharts({
                                chart: {
                                    type: 'spline',
                                    zoomType: 'x'
                                },
                                title: {
                                    text: ''
                                },
                                xAxis: {
                                    type: 'datetime'
                                },
                                yAxis: [{
                                    title: {
                                        text: 'Throughput (rpm)'
                                    },
                                    min: 0,
                                    max: rpmmax
                                }
                                ],
                                plotOptions: {
                                    series: {
                                        marker: {
                                            enabled: false
                                        },
                                        animation: false
                                    }
                                },
                                legend: {
                                    enabled: false
                                },
                                credits: {
									enabled: false
								},
                                series: [
                                    {
                                        name: 'rpm',
                                        yAxis: 0,
                                        data: rpm,
                                        color: "green",
                                        type: 'area',
                                        fillColor: {
                                            linearGradient: {
                                                x1: 0,
                                                y1: 0,
                                                x2: 0,
                                                y2: 1
                                            },
                                            stops: [
                                                [0, 'lightgreen'],
                                                [1, 'white']
                                            ]
                                        }
                                    }
                                ]
                            })
                            self.$('#time-one').highcharts({
                                chart: {
                                    type: 'spline',
                                    zoomType: 'x'
                                },
                                title: {
                                    text: ''
                                },
                                xAxis: {
                                    type: 'datetime'
                                },
                                yAxis: [{
                                    title: {
                                        text: 'Timing (s)'
                                    },
                                    min: 0,
                                    max: ttBrowserMax
                                }
                                ],
                                plotOptions: {
                                    series: {
                                        marker: {
                                            enabled: false
                                        },
                                        animation: false
                                    }
                                },
                                legend: {
                                    enabled: false
                                },
                                credits: {
									enabled: false
								},
                                series: [
                                    {
                                        name: 'time',
                                        yAxis: 0,
                                        data: ttBrowser,
                                        color: "blue",
                                        type: 'area',
                                        fillColor: {
                                            linearGradient: {
                                                x1: 0,
                                                y1: 0,
                                                x2: 0,
                                                y2: 1
                                            },
                                            stops: [
                                                [0, 'lightblue'],
                                                [1, 'white']
                                            ]
                                        }
                                    }
                                ]
                            })
                        }))
        }
    })
    View.id = "views/database_view";
    return View;
})
