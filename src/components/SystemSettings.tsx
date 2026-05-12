import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SettingsIcon, SaveIcon, RotateCcwIcon, WrenchIcon, DatabaseIcon } from 'lucide-react';
import { APP_CONFIG } from '@/utils/constants';
import { useToast } from '@/hooks/use-toast';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    businessName: APP_CONFIG.name,
    currency: APP_CONFIG.business.currency,
    timezone: APP_CONFIG.business.timezone,
    openTime: APP_CONFIG.business.openHours.start,
    closeTime: APP_CONFIG.business.openHours.end,
    reminderMinutes: APP_CONFIG.business.appointmentReminderMinutes,
    autoRefresh: true,
    refreshInterval: APP_CONFIG.ui.refreshInterval / 1000,
    enableNotifications: true,
    enableSounds: true,
    defaultPS5Single: APP_CONFIG.business.defaultPricing.ps5Single,
    defaultPS5Multi: APP_CONFIG.business.defaultPricing.ps5Multiplayer,
    defaultPS4Single: APP_CONFIG.business.defaultPricing.ps4Single,
    defaultPS4Multi: APP_CONFIG.business.defaultPricing.ps4Multiplayer,
  });

  const { toast } = useToast();
  const [isRunningCleanup, setIsRunningCleanup] = useState(false);

  const runDataCleanup = async () => {
    setIsRunningCleanup(true);
    try {
      const { runFullDataCleanup } = await import('@/utils/dataCleanup');
      const results = await runFullDataCleanup();
      
      const totalFixed = results.orphanOrders.fixedCount + results.legacyOrders.fixedCount;
      
      toast({
        title: "Data Cleanup Completed",
        description: `Fixed ${totalFixed} issues. Valid transactions: ${results.transactionValidation.validCount}/${results.transactionValidation.totalCount}`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Error running data cleanup:', error);
      toast({
        title: "Cleanup Error",
        description: "Failed to complete data cleanup",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsRunningCleanup(false);
    }
  };

  const handleSave = () => {
    // In a real application, these settings would be saved to a config file
    localStorage.setItem('app_settings', JSON.stringify(settings));
    
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully",
      duration: 3000,
    });
  };

  const handleReset = () => {
    setSettings({
      businessName: APP_CONFIG.name,
      currency: APP_CONFIG.business.currency,
      timezone: APP_CONFIG.business.timezone,
      openTime: APP_CONFIG.business.openHours.start,
      closeTime: APP_CONFIG.business.openHours.end,
      reminderMinutes: APP_CONFIG.business.appointmentReminderMinutes,
      autoRefresh: true,
      refreshInterval: APP_CONFIG.ui.refreshInterval / 1000,
      enableNotifications: true,
      enableSounds: true,
      defaultPS5Single: APP_CONFIG.business.defaultPricing.ps5Single,
      defaultPS5Multi: APP_CONFIG.business.defaultPricing.ps5Multiplayer,
      defaultPS4Single: APP_CONFIG.business.defaultPricing.ps4Single,
      defaultPS4Multi: APP_CONFIG.business.defaultPricing.ps4Multiplayer,
    });
    
    toast({
      title: "Settings Reset",
      description: "Settings have been reset to defaults",
      duration: 3000,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">System Settings</h3>
        <div className="flex gap-2">
          <Button 
            onClick={runDataCleanup} 
            disabled={isRunningCleanup}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <WrenchIcon className="w-4 h-4 mr-2" />
            {isRunningCleanup ? 'Running...' : 'Data Cleanup'}
          </Button>
          <Button onClick={handleReset} variant="outline">
            <RotateCcwIcon className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            <SaveIcon className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* System Maintenance */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DatabaseIcon className="w-5 h-5" />
            System Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-gray-300 text-sm">
            Run system maintenance to fix orphaned orders, legacy data issues, and validate transaction integrity.
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={runDataCleanup} 
              disabled={isRunningCleanup}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <WrenchIcon className="w-4 h-4 mr-2" />
              {isRunningCleanup ? 'Running Cleanup...' : 'Run Data Cleanup'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Business Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName" className="text-white">Business Name</Label>
              <Input
                id="businessName"
                value={settings.businessName}
                onChange={(e) => setSettings({...settings, businessName: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="openTime" className="text-white">Opening Time</Label>
                <Input
                  id="openTime"
                  type="time"
                  value={settings.openTime}
                  onChange={(e) => setSettings({...settings, openTime: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="closeTime" className="text-white">Closing Time</Label>
                <Input
                  id="closeTime"
                  type="time"
                  value={settings.closeTime}
                  onChange={(e) => setSettings({...settings, closeTime: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="currency" className="text-white">Currency</Label>
              <Select value={settings.currency} onValueChange={(value) => setSettings({...settings, currency: value})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="EGP" className="text-white">Egyptian Pound (EGP)</SelectItem>
                  <SelectItem value="USD" className="text-white">US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR" className="text-white">Euro (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reminderMinutes" className="text-white">Appointment Reminder (minutes)</Label>
              <Input
                id="reminderMinutes"
                type="number"
                min="5"
                max="60"
                value={settings.reminderMinutes}
                onChange={(e) => setSettings({...settings, reminderMinutes: parseInt(e.target.value)})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Application Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Application Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoRefresh" className="text-white">Auto Refresh</Label>
              <Switch
                id="autoRefresh"
                checked={settings.autoRefresh}
                onCheckedChange={(checked) => setSettings({...settings, autoRefresh: checked})}
              />
            </div>

            <div>
              <Label htmlFor="refreshInterval" className="text-white">Refresh Interval (seconds)</Label>
              <Input
                id="refreshInterval"
                type="number"
                min="10"
                max="300"
                value={settings.refreshInterval}
                onChange={(e) => setSettings({...settings, refreshInterval: parseInt(e.target.value)})}
                className="bg-slate-700 border-slate-600 text-white"
                disabled={!settings.autoRefresh}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enableNotifications" className="text-white">Enable Notifications</Label>
              <Switch
                id="enableNotifications"
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => setSettings({...settings, enableNotifications: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enableSounds" className="text-white">Enable Sound Alerts</Label>
              <Switch
                id="enableSounds"
                checked={settings.enableSounds}
                onCheckedChange={(checked) => setSettings({...settings, enableSounds: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Default Pricing */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Default Pricing (for new rooms)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="ps5Single" className="text-white">PS5 Single (EGP/hr)</Label>
                <Input
                  id="ps5Single"
                  type="number"
                  step="0.01"
                  value={settings.defaultPS5Single}
                  onChange={(e) => setSettings({...settings, defaultPS5Single: parseFloat(e.target.value)})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="ps5Multi" className="text-white">PS5 Multiplayer (EGP/hr)</Label>
                <Input
                  id="ps5Multi"
                  type="number"
                  step="0.01"
                  value={settings.defaultPS5Multi}
                  onChange={(e) => setSettings({...settings, defaultPS5Multi: parseFloat(e.target.value)})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="ps4Single" className="text-white">PS4 Single (EGP/hr)</Label>
                <Input
                  id="ps4Single"
                  type="number"
                  step="0.01"
                  value={settings.defaultPS4Single}
                  onChange={(e) => setSettings({...settings, defaultPS4Single: parseFloat(e.target.value)})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="ps4Multi" className="text-white">PS4 Multiplayer (EGP/hr)</Label>
                <Input
                  id="ps4Multi"
                  type="number"
                  step="0.01"
                  value={settings.defaultPS4Multi}
                  onChange={(e) => setSettings({...settings, defaultPS4Multi: parseFloat(e.target.value)})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemSettings;
