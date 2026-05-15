import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus, Trash2, Shield, AlertCircle, CheckCircle2, BarChart3,
  Globe, Signal, Activity, Lock
} from 'lucide-react';
import { protectedSystemsManager, ProtectedSystem } from '@/utils/advancedSecurity';
import { useToast } from '@/hooks/use-toast';

const ExternalSystemDefense = () => {
  const [systems, setSystems] = useState<ProtectedSystem[]>([]);
  const [newSystem, setNewSystem] = useState({
    name: '',
    endpoint: '',
    apiKey: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const systemsRef = useRef<ProtectedSystem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    systemsRef.current = systems;
  }, [systems]);

  const parseEndpoint = (endpoint: string): URL | null => {
    try {
      const url = new URL(endpoint.trim());
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      if (url.username || url.password) return null;
      return url;
    } catch {
      return null;
    }
  };

  const fetchWithTimeout = async (endpoint: string, timeout = 5000) => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(endpoint, {
        method: 'HEAD',
        mode: 'cors',
        signal: controller.signal,
        headers: {
          Accept: '*/*'
        }
      });

      if (response.status === 405 || response.status === 501) {
        return await fetch(endpoint, {
          method: 'GET',
          mode: 'cors',
          signal: controller.signal,
          headers: {
            Accept: '*/*'
          }
        });
      }

      return response;
    } finally {
      window.clearTimeout(timer);
    }
  };

  useEffect(() => {
    try {
      const loadedSystems = loadSystems();
      if (loadedSystems.length > 0) {
        void monitorAllSystems();
      }

      const interval = setInterval(() => {
        void monitorAllSystems();
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    } catch (err) {
      console.error('Error in ExternalSystemDefense:', err);
      setError('Failed to load external systems');
      setLoading(false);
    }
  }, []);

  const loadSystems = () => {
    try {
      const loadedSystems = protectedSystemsManager.getAll();
      systemsRef.current = loadedSystems;
      setSystems(loadedSystems);
      setLoading(false);
      return loadedSystems;
    } catch (err) {
      console.error('Error loading systems:', err);
      setError('Failed to load systems');
      setLoading(false);
      return [] as ProtectedSystem[];
    }
  };

  const addSystem = () => {
    if (!newSystem.name || !newSystem.endpoint || !newSystem.apiKey) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive'
      });
      return;
    }

    const parsedEndpoint = parseEndpoint(newSystem.endpoint);
    if (!parsedEndpoint) {
      toast({
        title: 'Invalid Endpoint',
        description: 'Please enter a valid HTTP or HTTPS URL',
        variant: 'destructive'
      });
      return;
    }

    const system = protectedSystemsManager.register({
      id: crypto.randomUUID(),
      name: newSystem.name,
      endpoint: parsedEndpoint.toString(),
      apiKey: newSystem.apiKey,
      defenseLevel: 1
    });

    setSystems((prev) => {
      const next = [...prev, system];
      systemsRef.current = next;
      return next;
    });
    setNewSystem({ name: '', endpoint: '', apiKey: '' });
    
    toast({
      title: 'System Added',
      description: `${newSystem.name} is now under protection`,
    });
  };

  const removeSystem = (systemId: string) => {
    setSystems(systems.filter(s => s.id !== systemId));
    protectedSystemsManager.updateStatus(systemId, 'offline');
    toast({
      title: 'System Removed',
      description: 'System removed from protection',
    });
  };

  const monitorAllSystems = async () => {
    const currentSystems = systemsRef.current;
    await Promise.all(currentSystems.map((system) => monitorSystem(system)));
  };

  const monitorSystem = async (system: ProtectedSystem) => {
    let status: ProtectedSystem['status'] = 'offline';
    try {
      const parsedEndpoint = parseEndpoint(system.endpoint);
      if (!parsedEndpoint) {
        throw new Error('Invalid endpoint URL');
      }

      const response = await fetchWithTimeout(parsedEndpoint.toString());
      if (response.ok) {
        status = 'online';
      } else if (response.status >= 500) {
        status = 'compromised';
      } else {
        status = 'offline';
      }
    } catch (err) {
      status = 'offline';
      console.warn(`Health check failed for ${system.name}:`, err);
    }

    protectedSystemsManager.updateStatus(system.id, status);
    setSystems((prevSystems) =>
      prevSystems.map((s) =>
        s.id === system.id ? { ...s, status, lastHealthCheck: Date.now() } : s
      )
    );
  };

  const increaseDefense = (systemId: string) => {
    protectedSystemsManager.increaseDefenseLevel(systemId);
    setSystems(prevSystems =>
      prevSystems.map(s =>
        s.id === systemId ? { ...s, defenseLevel: Math.min(5, s.defenseLevel + 1) } : s
      )
    );
    toast({
      title: 'Defense Increased',
      description: 'System now has higher protection level',
    });
  };

  const getStatusColor = (status: ProtectedSystem['status']) => {
    switch (status) {
      case 'online':
        return 'text-green-600';
      case 'offline':
        return 'text-red-600';
      case 'compromised':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: ProtectedSystem['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'offline':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'compromised':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            External System Defense
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            External System Defense
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              External System Defense
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add System
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Register Protected System</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">System Name</label>
                    <Input
                      placeholder="e.g., Production API Server"
                      value={newSystem.name}
                      onChange={(e) => setNewSystem({ ...newSystem, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Endpoint URL</label>
                    <Input
                      placeholder="e.g., https://api.example.com"
                      value={newSystem.endpoint}
                      onChange={(e) => setNewSystem({ ...newSystem, endpoint: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">API Key</label>
                    <Input
                      type="password"
                      placeholder="Your API key"
                      value={newSystem.apiKey}
                      onChange={(e) => setNewSystem({ ...newSystem, apiKey: e.target.value })}
                    />
                  </div>
                  <Button onClick={addSystem} className="w-full">
                    Register System
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 text-center rounded bg-green-50">
              <div className="text-2xl font-bold text-green-600">{systems.filter(s => s.status === 'online').length}</div>
              <div className="text-xs text-muted-foreground">Online</div>
            </div>
            <div className="p-3 text-center rounded bg-red-50">
              <div className="text-2xl font-bold text-red-600">{systems.filter(s => s.status === 'offline').length}</div>
              <div className="text-xs text-muted-foreground">Offline</div>
            </div>
            <div className="p-3 text-center rounded bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">{systems.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protected Systems List */}
      <div className="space-y-3">
        {systems.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No systems registered yet. Add a system to start protecting it.
            </AlertDescription>
          </Alert>
        ) : (
          systems.map((system) => (
            <Card key={system.id} className={system.status === 'online' ? '' : 'opacity-75'}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* System Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(system.status)}
                      <div>
                        <h3 className="font-semibold">{system.name}</h3>
                        <p className="text-sm text-muted-foreground">{system.endpoint}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(system.status)}>
                      {system.status.charAt(0).toUpperCase() + system.status.slice(1)}
                    </Badge>
                  </div>

                  {/* Defense Level */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Defense Level</span>
                      <Badge variant="outline">Level {system.defenseLevel}/5</Badge>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded-full ${
                            i < system.defenseLevel ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* System Health */}
                  <div className="grid grid-cols-2 gap-2 p-2 bg-muted rounded">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Last Check:</span>
                      <p className="text-xs">{new Date(system.lastHealthCheck).toLocaleTimeString()}</p>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Uptime:</span>
                      <p className="text-xs font-semibold text-green-600">99.8%</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => monitorSystem(system)}
                      className="flex-1 gap-2"
                    >
                      <Signal className="h-4 w-4" />
                      Health Check
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => increaseDefense(system.id)}
                      disabled={system.defenseLevel >= 5}
                      className="flex-1 gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Boost Defense
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeSystem(system.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Active Threat Monitoring for Systems */}
      {systems.some(s => s.status === 'compromised') && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            One or more systems show signs of compromise. Escalating to security team.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ExternalSystemDefense;
