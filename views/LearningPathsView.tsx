import React from 'react';
import Card from '../components/Card';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { PlayIcon } from '../components/icons/PlayIcon';

const LearningPathsView: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Card>
                <h3 className="text-lg font-semibold">Personalized Learning Paths</h3>
                <p className="text-sm text-muted-foreground mb-6">Generate optimized learning sequences based on your current knowledge and goals</p>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">What do you already know?</label>
                        {/* This could be a multi-select component in the future */}
                        <p className="text-sm text-muted-foreground">Feature coming soon: Select concepts you've already mastered.</p>
                    </div>

                    <div>
                        <label htmlFor="learning-goal" className="block text-sm font-medium text-foreground mb-2">What do you want to learn?</label>
                        <div className="relative">
                            <select 
                                id="learning-goal"
                                className="w-full appearance-none px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option>Select a learning goal</option>
                                {/* Options would be populated from graph nodes */}
                            </select>
                             <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                    
                    <button className="w-full flex items-center justify-center px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring transition-colors">
                        <PlayIcon className="w-5 h-5 mr-2" />
                        Generate Learning Path
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default LearningPathsView;
