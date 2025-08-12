import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, CheckCircle2, Circle, Filter } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Task, CreateTaskInput } from '../../server/src/schema';

type SortOption = 'all' | 'completed' | 'pending';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortFilter, setSortFilter] = useState<SortOption>('all');
  
  // Form state for new task creation
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: null
  });

  // Load tasks from API
  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Filter and sort tasks based on current filter
  const filteredTasks = tasks.filter((task: Task) => {
    if (sortFilter === 'completed') return task.completed;
    if (sortFilter === 'pending') return !task.completed;
    return true; // 'all'
  }).sort((a: Task, b: Task) => {
    // Sort by completion status (incomplete first), then by creation date
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Handle form submission for new task
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setIsLoading(true);
    try {
      const newTask = await trpc.createTask.mutate(formData);
      setTasks((prev: Task[]) => [newTask, ...prev]);
      // Reset form
      setFormData({
        title: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle task completion status
  const toggleTaskCompletion = async (task: Task) => {
    try {
      const updatedTask = await trpc.updateTask.mutate({
        id: task.id,
        completed: !task.completed
      });
      setTasks((prev: Task[]) => 
        prev.map((t: Task) => t.id === task.id ? updatedTask : t)
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Delete task
  const deleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((t: Task) => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const completedCount = tasks.filter((t: Task) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ✨ My Todo List
          </h1>
          <p className="text-gray-600">
            Stay organized and get things done!
          </p>
          {totalCount > 0 && (
            <div className="mt-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {completedCount} of {totalCount} completed 🎉
              </Badge>
            </div>
          )}
        </div>

        {/* Add Task Form */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="What needs to be done? 🤔"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTaskInput) => ({ 
                      ...prev, 
                      title: e.target.value 
                    }))
                  }
                  className="text-lg"
                  required
                />
              </div>
              <div>
                <Textarea
                  placeholder="Add some details... (optional) 📝"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateTaskInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  className="resize-none"
                  rows={3}
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || !formData.title.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {isLoading ? 'Creating...' : '➕ Add Task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Filter Controls */}
        {tasks.length > 0 && (
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            <Select value={sortFilter} onValueChange={(value: SortOption) => setSortFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks ({totalCount})</SelectItem>
                <SelectItem value="pending">Pending ({totalCount - completedCount})</SelectItem>
                <SelectItem value="completed">Completed ({completedCount})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card className="text-center py-12 shadow-lg border-0 bg-white/60 backdrop-blur">
              <CardContent>
                {tasks.length === 0 ? (
                  <div>
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      No tasks yet!
                    </h3>
                    <p className="text-gray-500">
                      Create your first task above to get started.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      No tasks found
                    </h3>
                    <p className="text-gray-500">
                      Try changing your filter to see more tasks.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task: Task) => (
              <Card 
                key={task.id} 
                className={`transition-all duration-200 shadow-md border-0 hover:shadow-lg ${
                  task.completed 
                    ? 'bg-green-50/80 backdrop-blur border-l-4 border-l-green-400' 
                    : 'bg-white/80 backdrop-blur border-l-4 border-l-blue-400'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task)}
                        className="w-5 h-5"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-semibold mb-1 ${
                        task.completed 
                          ? 'text-green-700 line-through' 
                          : 'text-gray-800'
                      }`}>
                        {task.completed ? '✅' : '🔘'} {task.title}
                      </h3>
                      
                      {task.description && (
                        <p className={`text-sm mb-3 ${
                          task.completed 
                            ? 'text-green-600 line-through' 
                            : 'text-gray-600'
                        }`}>
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>
                          Created: {new Date(task.created_at).toLocaleDateString()}
                        </span>
                        {task.completed && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                        {!task.completed && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            <Circle className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Task</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{task.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteTask(task.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        {tasks.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              Keep going! You're doing great! 🌟
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;