import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Calendar, Users, TrendingUp, BarChart3 } from 'lucide-react';

interface ReportData {
  id: string;
  type: string;
  title: string;
  description: string;
  data: any;
  generated_at: string;
}

const AdminReports = () => {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    // Since we don't have a reports table, we'll generate mock reports
    const mockReports: ReportData[] = [
      {
        id: '1',
        type: 'events',
        title: 'Events Summary Report',
        description: 'Overview of all events, attendance, and performance metrics',
        data: {},
        generated_at: new Date().toISOString()
      },
      {
        id: '2',
        type: 'users',
        title: 'User Activity Report',
        description: 'User registration trends, activity levels, and engagement metrics',
        data: {},
        generated_at: new Date().toISOString()
      },
      {
        id: '3',
        type: 'rsvps',
        title: 'RSVP Analytics Report',
        description: 'Response rates, attendance patterns, and conversion metrics',
        data: {},
        generated_at: new Date().toISOString()
      },
      {
        id: '4',
        type: 'feedback',
        title: 'Feedback & Reviews Report',
        description: 'User feedback analysis, ratings, and satisfaction scores',
        data: {},
        generated_at: new Date().toISOString()
      }
    ];
    
    setReports(mockReports);
    setLoading(false);
  };

  const generateReport = async (reportType: string) => {
    setGenerating(reportType);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Success",
        description: `${reportType} report generated successfully`
      });
      
      // In a real implementation, you would:
      // 1. Query the database for relevant data
      // 2. Process and format the data
      // 3. Generate the report (PDF, CSV, etc.)
      // 4. Save or download the report
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setGenerating(null);
    }
  };

  const downloadReport = (reportId: string, reportTitle: string) => {
    // In a real implementation, this would download the actual report file
    toast({
      title: "Download Started",
      description: `Downloading ${reportTitle}...`
    });
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'events': return <Calendar className="h-4 w-4" />;
      case 'users': return <Users className="h-4 w-4" />;
      case 'rsvps': return <TrendingUp className="h-4 w-4" />;
      case 'feedback': return <BarChart3 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Reports</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
  {/* Header */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-center space-x-2">
      <FileText className="h-6 w-6" />
      <h1 className="text-xl sm:text-2xl font-semibold">Reports & Analytics</h1>
    </div>
    <Badge variant="outline" className="w-fit">
      {reports.length} Available Reports
    </Badge>
  </div>

  {/* Quick Actions */}
  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {[
      { type: 'events', title: 'Events Report', icon: Calendar },
      { type: 'users', title: 'Users Report', icon: Users },
      { type: 'rsvps', title: 'RSVP Report', icon: TrendingUp },
      { type: 'feedback', title: 'Feedback Report', icon: BarChart3 }
    ].map((report) => (
      <Card key={report.type} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <report.icon className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium">{report.title}</p>
                <p className="text-xs text-muted-foreground">Generate latest</p>
              </div>
            </div>
            <Button
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => generateReport(report.type)}
              disabled={generating === report.type}
            >
              {generating === report.type ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>

  {/* Reports Table */}
  <Tabs defaultValue="all" className="space-y-4">
    <TabsList className="flex justify-start flex-wrap gap-2">
      <TabsTrigger value="all">All Reports</TabsTrigger>
      <TabsTrigger value="events">Events</TabsTrigger>
      <TabsTrigger value="users">Users</TabsTrigger>
      <TabsTrigger value="analytics">Analytics</TabsTrigger>
    </TabsList>

    {/* All Reports */}
    <TabsContent value="all" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[750px]">
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Last Generated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getReportIcon(report.type)}
                      <span className="font-medium truncate max-w-[150px]">{report.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </TableCell>
                  <TableCell>{new Date(report.generated_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateReport(report.type)}
                        disabled={generating === report.type}
                      >
                        {generating === report.type ? 'Generating...' : 'Regenerate'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => downloadReport(report.id, report.title)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>

    {/* Category Tabs */}
    {['events', 'users', 'analytics'].map((category) => (
      <TabsContent key={category} value={category} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{category.charAt(0).toUpperCase() + category.slice(1)} Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {category.charAt(0).toUpperCase() + category.slice(1)} Reports
              </h3>
              <p className="text-muted-foreground mb-4">
                Generate detailed reports for {category} data and analytics
              </p>
              <Button
                className="w-full sm:w-auto"
                onClick={() => generateReport(category)}
              >
                Generate {category.charAt(0).toUpperCase() + category.slice(1)} Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    ))}
  </Tabs>
</div>

  );
};

export default AdminReports;