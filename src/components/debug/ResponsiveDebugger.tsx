"use client";

import React, { useState, useEffect } from 'react';
import { useResponsive, useDeviceInfo, usePerformanceMetrics } from '@/hooks/use-responsive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet, Laptop, Eye, EyeOff, RefreshCw } from 'lucide-react';

interface ResponsiveDebuggerProps {
  className?: string;
  position?: 'fixed' | 'relative';
}

export function ResponsiveDebugger({ 
  className = '', 
  position = 'fixed' 
}: ResponsiveDebuggerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const responsive = useResponsive();
  const deviceInfo = useDeviceInfo();
  const performanceMetrics = usePerformanceMetrics();

  // Keyboard shortcut to toggle debugger
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  const getDeviceIcon = () => {
    if (responsive.isMobile) return <Smartphone className="w-4 h-4" />;
    if (responsive.isTablet) return <Tablet className="w-4 h-4" />;
    if (responsive.isDesktop) return responsive.isLarge ? <Monitor className="w-4 h-4" /> : <Laptop className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getBreakpointColor = (bp: string) => {
    switch (bp) {
      case 'xs': return 'bg-red-500';
      case 'sm': return 'bg-orange-500';
      case 'md': return 'bg-yellow-500';
      case 'lg': return 'bg-green-500';
      case 'xl': return 'bg-blue-500';
      case '2xl': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const formatMetric = (value: number, unit: string = 'ms') => {
    return value > 0 ? `${value.toFixed(1)}${unit}` : 'N/A';
  };

  const getPerformanceStatus = (metric: string, value: number) => {
    switch (metric) {
      case 'fcp':
        return value < 1500 ? 'good' : value < 2500 ? 'needs-improvement' : 'poor';
      case 'lcp':
        return value < 2500 ? 'good' : value < 4000 ? 'needs-improvement' : 'poor';
      case 'fid':
        return value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor';
      case 'cls':
        return value < 0.1 ? 'good' : value < 0.25 ? 'needs-improvement' : 'poor';
      case 'ttfb':
        return value < 600 ? 'good' : value < 1500 ? 'needs-improvement' : 'poor';
      default:
        return 'unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500 text-white';
      case 'needs-improvement': return 'bg-yellow-500 text-black';
      case 'poor': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        size="sm"
        variant="outline"
        className={`
          ${position === 'fixed' ? 'fixed bottom-4 right-4 z-50' : ''} 
          ${className}
          opacity-50 hover:opacity-100 transition-opacity
        `}
        data-testid="responsive-debugger-toggle"
      >
        <Eye className="w-4 h-4" />
        <span className="sr-only">Show Responsive Debugger</span>
      </Button>
    );
  }

  return (
    <Card className={`
      ${position === 'fixed' ? 'fixed bottom-4 right-4 z-50' : ''} 
      ${className}
      w-80 max-h-96 overflow-hidden shadow-lg border-2
    `}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getDeviceIcon()}
            Responsive Debug
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <EyeOff className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="text-xs space-y-3 max-h-80 overflow-y-auto">
        {/* Viewport Info */}
        <div className="space-y-1">
          <div className="font-medium text-foreground">Viewport</div>
          <div className="flex items-center gap-2">
            <span>{responsive.width} × {responsive.height}</span>
            <Badge 
              variant="secondary" 
              className={`${getBreakpointColor(responsive.breakpoint)} text-white text-[10px]`}
            >
              {responsive.breakpoint.toUpperCase()}
            </Badge>
          </div>
          <div className="text-muted-foreground">
            {responsive.orientation} • {responsive.pixelRatio}x DPR
          </div>
        </div>

        {/* Device Classification */}
        <div className="space-y-1">
          <div className="font-medium text-foreground">Device Type</div>
          <div className="flex gap-1 flex-wrap">
            {responsive.isMobile && <Badge variant="outline" className="text-[10px]">Mobile</Badge>}
            {responsive.isTablet && <Badge variant="outline" className="text-[10px]">Tablet</Badge>}
            {responsive.isDesktop && <Badge variant="outline" className="text-[10px]">Desktop</Badge>}
            {responsive.isTouch && <Badge variant="outline" className="text-[10px]">Touch</Badge>}
          </div>
        </div>

        {/* Browser Info */}
        {isExpanded && (
          <div className="space-y-1">
            <div className="font-medium text-foreground">Browser</div>
            <div className="flex gap-1 flex-wrap">
              {deviceInfo.isChrome && <Badge variant="outline" className="text-[10px]">Chrome</Badge>}
              {deviceInfo.isFirefox && <Badge variant="outline" className="text-[10px]">Firefox</Badge>}
              {deviceInfo.isSafari && <Badge variant="outline" className="text-[10px]">Safari</Badge>}
              {deviceInfo.isEdge && <Badge variant="outline" className="text-[10px]">Edge</Badge>}
              {deviceInfo.isIOS && <Badge variant="outline" className="text-[10px]">iOS</Badge>}
              {deviceInfo.isAndroid && <Badge variant="outline" className="text-[10px]">Android</Badge>}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {isExpanded && (
          <div className="space-y-1">
            <div className="font-medium text-foreground">Performance</div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div className="flex justify-between">
                <span>FCP:</span>
                <Badge 
                  className={`${getStatusColor(getPerformanceStatus('fcp', performanceMetrics.fcp))} text-[9px] h-4`}
                >
                  {formatMetric(performanceMetrics.fcp)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>LCP:</span>
                <Badge 
                  className={`${getStatusColor(getPerformanceStatus('lcp', performanceMetrics.lcp))} text-[9px] h-4`}
                >
                  {formatMetric(performanceMetrics.lcp)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>FID:</span>
                <Badge 
                  className={`${getStatusColor(getPerformanceStatus('fid', performanceMetrics.fid))} text-[9px] h-4`}
                >
                  {formatMetric(performanceMetrics.fid)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>CLS:</span>
                <Badge 
                  className={`${getStatusColor(getPerformanceStatus('cls', performanceMetrics.cls))} text-[9px] h-4`}
                >
                  {formatMetric(performanceMetrics.cls, '')}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Breakpoint Tests */}
        {isExpanded && (
          <div className="space-y-1">
            <div className="font-medium text-foreground">Breakpoint Tests</div>
            <div className="space-y-1">
              {['xs', 'sm', 'md', 'lg', 'xl', '2xl'].map(bp => (
                <div key={bp} className="flex justify-between items-center">
                  <span className="text-[10px]">{bp}:</span>
                  <span className={`text-[10px] ${responsive.isAbove(bp as any) ? 'text-green-600' : 'text-red-600'}`}>
                    {responsive.isAbove(bp as any) ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-2 border-t border-border">
          <div className="text-[10px] text-muted-foreground">
            Press Ctrl+Shift+R to toggle
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Developer mode component for testing
export function ResponsiveTestSuite() {
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
  }>>([]);

  const responsive = useResponsive();

  const runTests = () => {
    const results: Array<{
      test: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
    }> = [];

    // Test 1: Viewport size
    results.push({
      test: 'Viewport Size',
      status: responsive.width >= 320 ? 'pass' : 'fail',
      message: `${responsive.width}x${responsive.height}px`
    });

    // Test 2: Touch targets (mobile)
    if (responsive.isMobile) {
      const buttons = document.querySelectorAll('button, a[role="button"]');
      const smallButtons = Array.from(buttons).filter(btn => {
        const rect = btn.getBoundingClientRect();
        return Math.min(rect.width, rect.height) < 44;
      });

      results.push({
        test: 'Touch Targets',
        status: smallButtons.length === 0 ? 'pass' : 'warning',
        message: `${smallButtons.length} elements below 44px`
      });
    }

    // Test 3: Horizontal scroll
    const hasHorizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    results.push({
      test: 'Horizontal Scroll',
      status: hasHorizontalScroll ? 'fail' : 'pass',
      message: hasHorizontalScroll ? 'Detected horizontal scroll' : 'No horizontal scroll'
    });

    // Test 4: Font size readability
    if (responsive.isMobile) {
      const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
      const smallText = Array.from(textElements).filter(el => {
        const fontSize = parseInt(window.getComputedStyle(el).fontSize);
        return fontSize < 14 && el.textContent && el.textContent.trim().length > 0;
      });

      results.push({
        test: 'Text Readability',
        status: smallText.length === 0 ? 'pass' : 'warning',
        message: `${smallText.length} elements with font < 14px`
      });
    }

    setTestResults(results);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm">Responsive Test Suite</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={runTests} size="sm" className="w-full">
          Run Tests
        </Button>
        
        {testResults.length > 0 && (
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={`p-2 rounded text-xs border ${
                  result.status === 'pass' ? 'bg-green-50 border-green-200 text-green-800' :
                  result.status === 'fail' ? 'bg-red-50 border-red-200 text-red-800' :
                  'bg-yellow-50 border-yellow-200 text-yellow-800'
                }`}
              >
                <div className="font-medium">{result.test}</div>
                <div className="text-[10px] opacity-75">{result.message}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
