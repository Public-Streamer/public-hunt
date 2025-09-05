import React from 'react';
import { Star, TrendingUp, Clock, Eye, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TrendingAd {
  id: string;
  title: string;
  thumbnail: string;
  starRating: number;
  viewThroughRate: number;
  avgViewTime: string;
  adDuration: string;
  topViewerTag: string;
  cpv: string;
  insight: string;
}

const TrendingAnalyticsPanel: React.FC = () => {
  // Mock trending ads data
  const trendingAds: TrendingAd[] = [
    {
      id: '1',
      title: 'FitLife Protein Shake',
      thumbnail: '/placeholder.svg',
      starRating: 4.8,
      viewThroughRate: 78,
      avgViewTime: '23s',
      adDuration: '30s',
      topViewerTag: 'Great Product',
      cpv: '$0.004',
      insight:
        'Kept it under 30 seconds with a punchy call to action — great for mobile viewers.',
    },
    {
      id: '2',
      title: 'TechGear Wireless Headphones',
      thumbnail: '/placeholder.svg',
      starRating: 4.6,
      viewThroughRate: 82,
      avgViewTime: '18s',
      adDuration: '25s',
      topViewerTag: 'Funny',
      cpv: '$0.003',
      insight:
        'Paired upbeat music with clear product showcase — resonated with lifestyle channels.',
    },
    {
      id: '3',
      title: 'GreenEats Meal Delivery',
      thumbnail: '/placeholder.svg',
      starRating: 4.7,
      viewThroughRate: 85,
      avgViewTime: '27s',
      adDuration: '30s',
      topViewerTag: 'Informative',
      cpv: '$0.005',
      insight:
        'Strong opening hook with health benefits led to high completion rates.',
    },
  ];

  const topViewerTags = [
    { tag: 'Great Product', percentage: 35 },
    { tag: 'Funny', percentage: 28 },
    { tag: 'Informative', percentage: 22 },
    { tag: 'Creative', percentage: 15 },
  ];

  const averageRating =
    trendingAds.reduce((acc, ad) => acc + ad.starRating, 0) /
    trendingAds.length;

  return (
    <div className="bg-gradient-to-br from-background to-secondary/10 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Trending This Week
          </h2>
          <p className="text-muted-foreground text-lg">
            See what's working and why these ads are performing well
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Average Star Rating
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">≤30s</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Optimal Ad Duration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">82%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Avg View-Through Rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* What Viewers Are Loving */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">What Viewers Are Loving</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topViewerTags.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-20">{item.tag}</span>
                  <div className="flex-1 bg-secondary/30 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-10">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trending Ads List */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">
            Top Performing Ads This Week
          </h3>

          <div className="grid gap-6">
            {trendingAds.map((ad, index) => (
              <Card
                key={ad.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Ad Preview */}
                    <div className="lg:w-1/4">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={ad.thumbnail}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Ad Details */}
                    <div className="lg:w-3/4 space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold mb-2">
                          {ad.title}
                        </h4>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">
                              {ad.starRating}
                            </span>
                          </div>
                          <Badge variant="info" className="text-xs">
                            {ad.topViewerTag}
                          </Badge>
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">
                              {ad.viewThroughRate}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              View-through
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">
                              {ad.avgViewTime}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Avg. view time
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-sm font-medium">{ad.cpv}</p>
                            <p className="text-xs text-muted-foreground">
                              Cost per view
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">
                              {ad.adDuration}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Duration
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Insight */}
                      <div className="bg-primary/5 rounded-lg p-4 border-l-4 border-primary">
                        <p className="text-sm text-muted-foreground italic">
                          💡 {ad.insight}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA for Advertisers */}
        <Card className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">
              Ready to Create Your Trending Ad?
            </h3>
            <p className="text-muted-foreground mb-4">
              Apply these insights to your next campaign and join the trending
              list!
            </p>
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Create Your Ad Now
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrendingAnalyticsPanel;
