export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      benchmarks: {
        Row: {
          accuracy: number | null
          confusion_matrix: Json | null
          created_at: string
          created_by: string | null
          experiment_id: string | null
          f1_score: number | null
          id: string
          inference_time_ms: number | null
          mode: Database["public"]["Enums"]["result_mode"]
          model_name: string
          model_type: string
          precision_score: number | null
          recall: number | null
          roc_auc: number | null
          roc_curve: Json | null
          specificity: number | null
          training_run_id: string | null
          training_time_ms: number | null
        }
        Insert: {
          accuracy?: number | null
          confusion_matrix?: Json | null
          created_at?: string
          created_by?: string | null
          experiment_id?: string | null
          f1_score?: number | null
          id?: string
          inference_time_ms?: number | null
          mode?: Database["public"]["Enums"]["result_mode"]
          model_name: string
          model_type: string
          precision_score?: number | null
          recall?: number | null
          roc_auc?: number | null
          roc_curve?: Json | null
          specificity?: number | null
          training_run_id?: string | null
          training_time_ms?: number | null
        }
        Update: {
          accuracy?: number | null
          confusion_matrix?: Json | null
          created_at?: string
          created_by?: string | null
          experiment_id?: string | null
          f1_score?: number | null
          id?: string
          inference_time_ms?: number | null
          mode?: Database["public"]["Enums"]["result_mode"]
          model_name?: string
          model_type?: string
          precision_score?: number | null
          recall?: number | null
          roc_auc?: number | null
          roc_curve?: Json | null
          specificity?: number | null
          training_run_id?: string | null
          training_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "benchmarks_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmarks_training_run_id_fkey"
            columns: ["training_run_id"]
            isOneToOne: false
            referencedRelation: "training_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      datasets: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          label_schema: Json | null
          modality: string | null
          name: string
          source: string | null
          source_url: string | null
          status: string
          total_studies: number | null
          updated_at: string
          version: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          label_schema?: Json | null
          modality?: string | null
          name: string
          source?: string | null
          source_url?: string | null
          status?: string
          total_studies?: number | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          label_schema?: Json | null
          modality?: string | null
          name?: string
          source?: string | null
          source_url?: string | null
          status?: string
          total_studies?: number | null
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      experiments: {
        Row: {
          classical_model: string | null
          completed_at: string | null
          configuration_json: Json | null
          created_at: string
          created_by: string | null
          dataset_id: string | null
          description: string | null
          id: string
          mode: Database["public"]["Enums"]["result_mode"]
          name: string
          quantum_model: string | null
          status: Database["public"]["Enums"]["experiment_status"]
          task: string
          updated_at: string
        }
        Insert: {
          classical_model?: string | null
          completed_at?: string | null
          configuration_json?: Json | null
          created_at?: string
          created_by?: string | null
          dataset_id?: string | null
          description?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["result_mode"]
          name: string
          quantum_model?: string | null
          status?: Database["public"]["Enums"]["experiment_status"]
          task?: string
          updated_at?: string
        }
        Update: {
          classical_model?: string | null
          completed_at?: string | null
          configuration_json?: Json | null
          created_at?: string
          created_by?: string | null
          dataset_id?: string | null
          description?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["result_mode"]
          name?: string
          quantum_model?: string | null
          status?: Database["public"]["Enums"]["experiment_status"]
          task?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiments_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_quantum_model_fkey"
            columns: ["quantum_model"]
            isOneToOne: false
            referencedRelation: "quantum_models"
            referencedColumns: ["id"]
          },
        ]
      }
      explanations: {
        Row: {
          attribution_json: Json | null
          created_at: string
          created_by: string | null
          explanation_summary: string | null
          feature_importance_json: Json | null
          heatmap_path: string | null
          id: string
          method: string
          mode: Database["public"]["Enums"]["result_mode"]
          prediction_id: string
        }
        Insert: {
          attribution_json?: Json | null
          created_at?: string
          created_by?: string | null
          explanation_summary?: string | null
          feature_importance_json?: Json | null
          heatmap_path?: string | null
          id?: string
          method: string
          mode?: Database["public"]["Enums"]["result_mode"]
          prediction_id: string
        }
        Update: {
          attribution_json?: Json | null
          created_at?: string
          created_by?: string | null
          explanation_summary?: string | null
          feature_importance_json?: Json | null
          heatmap_path?: string | null
          id?: string
          method?: string
          mode?: Database["public"]["Enums"]["result_mode"]
          prediction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "explanations_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_compressions: {
        Row: {
          created_at: string
          created_by: string | null
          explained_variance: number | null
          feature_extraction_id: string
          id: string
          input_dimension: number
          method: string
          mode: Database["public"]["Enums"]["result_mode"]
          output_dimension: number
          parameters: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          explained_variance?: number | null
          feature_extraction_id: string
          id?: string
          input_dimension?: number
          method?: string
          mode?: Database["public"]["Enums"]["result_mode"]
          output_dimension?: number
          parameters?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          explained_variance?: number | null
          feature_extraction_id?: string
          id?: string
          input_dimension?: number
          method?: string
          mode?: Database["public"]["Enums"]["result_mode"]
          output_dimension?: number
          parameters?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_compressions_feature_extraction_id_fkey"
            columns: ["feature_extraction_id"]
            isOneToOne: false
            referencedRelation: "feature_extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_extractions: {
        Row: {
          created_at: string
          created_by: string | null
          embedding_path: string | null
          extraction_time_ms: number | null
          feature_dimension: number
          id: string
          mode: Database["public"]["Enums"]["result_mode"]
          model_name: string
          model_version: string | null
          preprocessing_run_id: string | null
          study_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          embedding_path?: string | null
          extraction_time_ms?: number | null
          feature_dimension?: number
          id?: string
          mode?: Database["public"]["Enums"]["result_mode"]
          model_name?: string
          model_version?: string | null
          preprocessing_run_id?: string | null
          study_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          embedding_path?: string | null
          extraction_time_ms?: number | null
          feature_dimension?: number
          id?: string
          mode?: Database["public"]["Enums"]["result_mode"]
          model_name?: string
          model_version?: string | null
          preprocessing_run_id?: string | null
          study_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_extractions_preprocessing_run_id_fkey"
            columns: ["preprocessing_run_id"]
            isOneToOne: false
            referencedRelation: "preprocessing_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_extractions_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          abnormal_probability: number
          confidence: number | null
          created_at: string
          created_by: string | null
          id: string
          inference_time_ms: number | null
          mode: Database["public"]["Enums"]["result_mode"]
          model_id: string | null
          model_version: string | null
          normal_probability: number
          predicted_class: string
          study_id: string
          training_run_id: string | null
        }
        Insert: {
          abnormal_probability: number
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          inference_time_ms?: number | null
          mode?: Database["public"]["Enums"]["result_mode"]
          model_id?: string | null
          model_version?: string | null
          normal_probability: number
          predicted_class: string
          study_id: string
          training_run_id?: string | null
        }
        Update: {
          abnormal_probability?: number
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          inference_time_ms?: number | null
          mode?: Database["public"]["Enums"]["result_mode"]
          model_id?: string | null
          model_version?: string | null
          normal_probability?: number
          predicted_class?: string
          study_id?: string
          training_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "quantum_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_training_run_id_fkey"
            columns: ["training_run_id"]
            isOneToOne: false
            referencedRelation: "training_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      preprocessing_runs: {
        Row: {
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          input_format: string | null
          mode: Database["public"]["Enums"]["result_mode"]
          normalization_method: string | null
          processing_time_ms: number | null
          run_id: string | null
          selected_slices: Json | null
          slices_processed: number | null
          status: Database["public"]["Enums"]["run_status"]
          study_id: string
          target_size: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          input_format?: string | null
          mode?: Database["public"]["Enums"]["result_mode"]
          normalization_method?: string | null
          processing_time_ms?: number | null
          run_id?: string | null
          selected_slices?: Json | null
          slices_processed?: number | null
          status?: Database["public"]["Enums"]["run_status"]
          study_id: string
          target_size?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          input_format?: string | null
          mode?: Database["public"]["Enums"]["result_mode"]
          normalization_method?: string | null
          processing_time_ms?: number | null
          run_id?: string | null
          selected_slices?: Json | null
          slices_processed?: number | null
          status?: Database["public"]["Enums"]["run_status"]
          study_id?: string
          target_size?: string
        }
        Relationships: [
          {
            foreignKeyName: "preprocessing_runs_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          institution: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          institution?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          institution?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quantum_models: {
        Row: {
          batch_size: number
          circuit_depth: number
          created_at: string
          created_by: string | null
          encoding_method: string
          entanglement_method: string
          epochs: number
          framework: string
          id: string
          learning_rate: number
          mode: Database["public"]["Enums"]["result_mode"]
          model_type: string
          name: string
          optimizer: string
          qubit_count: number
          simulator: string
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          batch_size?: number
          circuit_depth?: number
          created_at?: string
          created_by?: string | null
          encoding_method?: string
          entanglement_method?: string
          epochs?: number
          framework?: string
          id?: string
          learning_rate?: number
          mode?: Database["public"]["Enums"]["result_mode"]
          model_type?: string
          name: string
          optimizer?: string
          qubit_count?: number
          simulator?: string
          status?: string
          updated_at?: string
          version?: string
        }
        Update: {
          batch_size?: number
          circuit_depth?: number
          created_at?: string
          created_by?: string | null
          encoding_method?: string
          entanglement_method?: string
          epochs?: number
          framework?: string
          id?: string
          learning_rate?: number
          mode?: Database["public"]["Enums"]["result_mode"]
          model_type?: string
          name?: string
          optimizer?: string
          qubit_count?: number
          simulator?: string
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      studies: {
        Row: {
          acquisition_date: string | null
          body_part: string | null
          created_at: string
          created_by: string | null
          dataset_id: string | null
          file_count: number
          id: string
          modality: string | null
          mode: Database["public"]["Enums"]["result_mode"]
          notes: string | null
          patient_reference: string
          preprocessing_status: string
          status: string
          study_uid: string | null
          updated_at: string
        }
        Insert: {
          acquisition_date?: string | null
          body_part?: string | null
          created_at?: string
          created_by?: string | null
          dataset_id?: string | null
          file_count?: number
          id?: string
          modality?: string | null
          mode?: Database["public"]["Enums"]["result_mode"]
          notes?: string | null
          patient_reference: string
          preprocessing_status?: string
          status?: string
          study_uid?: string | null
          updated_at?: string
        }
        Update: {
          acquisition_date?: string | null
          body_part?: string | null
          created_at?: string
          created_by?: string | null
          dataset_id?: string | null
          file_count?: number
          id?: string
          modality?: string | null
          mode?: Database["public"]["Enums"]["result_mode"]
          notes?: string | null
          patient_reference?: string
          preprocessing_status?: string
          status?: string
          study_uid?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studies_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      study_files: {
        Row: {
          checksum: string | null
          created_at: string
          created_by: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          mime_type: string | null
          storage_path: string
          study_id: string
          upload_status: string
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          created_by?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          mime_type?: string | null
          storage_path: string
          study_id: string
          upload_status?: string
        }
        Update: {
          checksum?: string | null
          created_at?: string
          created_by?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          mime_type?: string | null
          storage_path?: string
          study_id?: string
          upload_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_files_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      training_runs: {
        Row: {
          batch_size: number | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          dataset_id: string | null
          dataset_version: string | null
          epochs: number | null
          error_message: string | null
          experiment_id: string | null
          id: string
          learning_rate: number | null
          metrics_json: Json | null
          mode: Database["public"]["Enums"]["result_mode"]
          model_id: string | null
          model_type: string
          reproducibility_json: Json | null
          run_name: string
          seed: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["run_status"]
          test_samples: number | null
          train_samples: number | null
          training_time_ms: number | null
          updated_at: string
          val_samples: number | null
        }
        Insert: {
          batch_size?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          dataset_id?: string | null
          dataset_version?: string | null
          epochs?: number | null
          error_message?: string | null
          experiment_id?: string | null
          id?: string
          learning_rate?: number | null
          metrics_json?: Json | null
          mode?: Database["public"]["Enums"]["result_mode"]
          model_id?: string | null
          model_type?: string
          reproducibility_json?: Json | null
          run_name: string
          seed?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          test_samples?: number | null
          train_samples?: number | null
          training_time_ms?: number | null
          updated_at?: string
          val_samples?: number | null
        }
        Update: {
          batch_size?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          dataset_id?: string | null
          dataset_version?: string | null
          epochs?: number | null
          error_message?: string | null
          experiment_id?: string | null
          id?: string
          learning_rate?: number | null
          metrics_json?: Json | null
          mode?: Database["public"]["Enums"]["result_mode"]
          model_id?: string | null
          model_type?: string
          reproducibility_json?: Json | null
          run_name?: string
          seed?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status"]
          test_samples?: number | null
          train_samples?: number | null
          training_time_ms?: number | null
          updated_at?: string
          val_samples?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_runs_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_runs_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_runs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "quantum_models"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_lead_or_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "researcher" | "research_lead" | "admin"
      experiment_status: "draft" | "queued" | "running" | "completed" | "failed"
      result_mode: "real" | "simulation" | "demo"
      run_status: "pending" | "queued" | "running" | "completed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["researcher", "research_lead", "admin"],
      experiment_status: ["draft", "queued", "running", "completed", "failed"],
      result_mode: ["real", "simulation", "demo"],
      run_status: ["pending", "queued", "running", "completed", "failed"],
    },
  },
} as const
